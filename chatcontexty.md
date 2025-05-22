"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
Conversation,
Message,
User,
ParticipantWithConversation,
} from "@/types";
import { useAuth } from "./AuthContext";

type ChatContextType = {
conversations: Conversation[];
currentConversation: Conversation | null;
messages: Message[];
loadingMessages: boolean;
loadingConversations: boolean;
sendMessage: (text: string, conversationId: string) => Promise<void>;
setCurrentConversationId: (id: string | null) => void;
currentConversationId: string | null;
createConversation: (userId: string) => Promise<string>;
};

const ChatContext = createContext<ChatContextType>({
conversations: [],
currentConversation: null,
messages: [],
loadingMessages: false,
loadingConversations: false,
sendMessage: async () => {},
setCurrentConversationId: () => {},
currentConversationId: null,
createConversation: async () => "",
});

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
children,
}) => {
const [conversations, setConversations] = useState<Conversation[]>([]);
const [currentConversationId, setCurrentConversationId] = useState<
string | null

> (null);
> const [currentConversation, setCurrentConversation] =

    useState<Conversation | null>(null);

const [messages, setMessages] = useState<Message[]>([]);
const [loadingMessages, setLoadingMessages] = useState(false);
const [loadingConversations, setLoadingConversations] = useState(false);
const { user } = useAuth();

// Store conversation IDs at component level to use across hooks
const [userConversationIds, setUserConversationIds] = useState<string[]>([]);

// Subscribe to conversations when user changes
useEffect(() => {
if (!user) return;

    setLoadingConversations(true);

    // Get all conversations for the current user
    const fetchConversations = async () => {
      const { data: participations, error } = await supabase
        .from("participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching conversations:", error);
        setLoadingConversations(false);
        return;
      }

      if (!participations || participations.length === 0) {
        setConversations([]);
        setUserConversationIds([]); // Update the state
        setLoadingConversations(false);
        return;
      }

      const conversationIds = participations.map((p) => p.conversation_id);
      setUserConversationIds(conversationIds); // Store the IDs for later use

      // Get detailed conversation info
      const { data: conversationsData, error: conversationsError } =
        await supabase
          .from("conversations")
          .select(
            `
          *,
          participants:participants(
            id,
            user_id,
            last_read_message_id,
            user:users(*)
          )
        `
          )
          .in("id", conversationIds)
          .order("updated_at", { ascending: false });

      if (conversationsError) {
        console.error(
          "Error fetching conversation details:",
          conversationsError
        );
        setLoadingConversations(false);
        return;
      }

      // Get last messages for each conversation
      const conversationsWithLastMessage = await Promise.all(
        conversationsData.map(async (conversation) => {
          if (conversation.last_message_id) {
            const { data: lastMessage } = await supabase
              .from("messages")
              .select("*")
              .eq("id", conversation.last_message_id)
              .single();

            // Calculate unread count
            const currentUserParticipant = conversation.participants.find(
              (p: any) => p.user_id === user.id
            );

            let unreadCount = 0;
            if (
              currentUserParticipant &&
              currentUserParticipant.last_read_message_id
            ) {
              const { count, error } = await supabase
                .from("messages")
                .select("*", { count: "exact", head: true })
                .eq("conversation_id", conversation.id)
                .gt(
                  "created_at",
                  supabase
                    .from("messages")
                    .select("created_at")
                    .eq("id", currentUserParticipant.last_read_message_id)
                    .single()
                );

              if (!error && count !== null) {
                unreadCount = count;
              }
            }

            return {
              ...conversation,
              last_message: lastMessage || null,
              unread_count: unreadCount,
            };
          }
          return {
            ...conversation,
            last_message: null,
            unread_count: 0,
          };
        })
      );

      setConversations(conversationsWithLastMessage);
      setLoadingConversations(false);
    };

    fetchConversations();

    // Subscribe to conversations changes
    const conversationsSubscription = supabase
      .channel("public:conversations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        (payload) => {
          console.log("Conversation changed:", payload);
          fetchConversations(); // Refetch all conversations when any updates
        }
      )
      .subscribe();

    // Subscribe to ANY changes in participants table for this user
    const participantsSubscription = supabase
      .channel("public:participants")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Participants changed:", payload);
          fetchConversations(); // Refetch all conversations when any updates
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsSubscription);
      supabase.removeChannel(participantsSubscription);
    };

}, [user]);

// Load messages when current conversation changes
useEffect(() => {
if (!currentConversationId) {
setMessages([]);
setCurrentConversation(null);
return;
}

    setLoadingMessages(true);

    // Find the conversation in our list
    const conversation =
      conversations.find((c) => c.id === currentConversationId) || null;
    setCurrentConversation(conversation);

    // Get messages for the current conversation
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", currentConversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
      } else {
        setMessages(data || []);
      }

      setLoadingMessages(false);

      // Update last read message if user is a participant
      if (user && conversation) {
        const participant = conversation.participants?.find(
          (p) => p.user_id === user.id
        );
        if (participant && data && data.length > 0) {
          const lastMessageId = data[data.length - 1].id;
          await supabase
            .from("participants")
            .update({ last_read_message_id: lastMessageId })
            .eq("id", participant.id);
        }
      }
    };

    fetchMessages();

    // Create conversation-specific subscription for immediate local updates
    // This is in addition to the global subscription for complete coverage
    const conversationSubscription = supabase
      .channel(`conversation-${currentConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${currentConversationId}`,
        },
        async (payload) => {
          console.log(
            "Message received in specific conversation subscription:",
            payload
          );
          const newMessage = payload.new as Message;

          // Update local messages
          setMessages((prevMessages) => {
            // Only add if not already present (avoid duplicates)
            if (!prevMessages.some((msg) => msg.id === newMessage.id)) {
              return [...prevMessages, newMessage];
            }
            return prevMessages;
          });

          // Mark as read
          if (user && conversation) {
            const participant = conversation.participants?.find(
              (p) => p.user_id === user.id
            );

            if (participant) {
              await supabase
                .from("participants")
                .update({ last_read_message_id: newMessage.id })
                .eq("id", participant.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationSubscription);
    };

}, [currentConversationId, conversations, user]);

// Send a message to the current conversation
const sendMessage = async (text: string, conversationId: string) => {
if (!user) return;

    // Optimistically add the message to the UI first
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: user.id,
      text,
      type: "TEXT",
      created_at: new Date().toISOString(),
      read_by: [],
      is_pinned: false,
    };

    // Add to local state immediately for better UX
    setMessages((prevMessages) => [...prevMessages, optimisticMessage]);

    // Create the message in the database
    const { data: messageData, error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        text,
        type: "TEXT",
      })
      .select()
      .single();

    if (messageError) {
      console.error("Error sending message:", messageError);
      // Remove the optimistic message on error
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== optimisticMessage.id)
      );
      return;
    }

    // Update the conversation's last message and timestamp
    const { error: conversationError } = await supabase
      .from("conversations")
      .update({
        last_message_id: messageData.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    if (conversationError) {
      console.error("Error updating conversation:", conversationError);
    }

    // Replace optimistic message with real one in case subscription is slow
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === optimisticMessage.id ? messageData : msg
      )
    );

};

// Create a new conversation with another user
const createConversation = async (userId: string): Promise<string> => {
if (!user) throw new Error("You must be logged in");
if (userId === user.id)
throw new Error("Cannot create conversation with yourself");

    // Check if conversation already exists
    const { data: existingParticipations } = await supabase
      .from("participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (existingParticipations && existingParticipations.length > 0) {
      const existingConversationIds = existingParticipations.map(
        (p) => p.conversation_id
      );

      const { data: otherParticipations } = (await supabase
        .from("participants")
        .select("conversation_id, conversation:conversations(is_group)")
        .eq("user_id", userId)
        .in("conversation_id", existingConversationIds)) as {
        data: ParticipantWithConversation[] | null;
      };

      const existingDirectConversation = otherParticipations?.find(
        (p) => !p.conversation.is_group
      );

      if (existingDirectConversation) {
        return existingDirectConversation.conversation_id;
      }
    }

    // Create a new conversation
    const { data: conversationData, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        is_group: false,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (conversationError || !conversationData) {
      throw new Error("Failed to create conversation");
    }

    const conversationId = conversationData.id;

    // Add both users as participants
    const participantsToInsert = [
      {
        user_id: user.id,
        conversation_id: conversationId,
        last_read_message_id: null,
      },
      {
        user_id: userId,
        conversation_id: conversationId,
        last_read_message_id: null,
      },
    ];

    const { error: participantsError } = await supabase
      .from("participants")
      .insert(participantsToInsert);

    if (participantsError) {
      throw new Error("Failed to add participants to conversation");
    }

    return conversationId;

};

return (
<ChatContext.Provider
value={{
        conversations,
        currentConversation,
        messages,
        loadingMessages,
        loadingConversations,
        sendMessage,
        setCurrentConversationId,
        currentConversationId,
        createConversation,
      }} >
{children}
</ChatContext.Provider>
);
};

export const useChat = () => {
return useContext(ChatContext);
};
