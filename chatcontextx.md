"use client";
import React, {
createContext,
useContext,
useEffect,
useState,
useRef,
} from "react";
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

// Add refs to track subscription channels
const messagesChannelRef = useRef<any>(null);
const globalChannelRef = useRef<any>(null);
const conversationsChannelRef = useRef<any>(null);
const participantsChannelRef = useRef<any>(null);

// Add ref for processed message IDs
const processedMessageIdsRef = useRef<Set<string>>(new Set());

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

    // Clean up previous subscription if exists
    if (conversationsChannelRef.current) {
      supabase.removeChannel(conversationsChannelRef.current);
    }

    if (participantsChannelRef.current) {
      supabase.removeChannel(participantsChannelRef.current);
    }

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

    conversationsChannelRef.current = conversationsSubscription;

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

    participantsChannelRef.current = participantsSubscription;

    return () => {
      if (conversationsChannelRef.current) {
        supabase.removeChannel(conversationsChannelRef.current);
      }
      if (participantsChannelRef.current) {
        supabase.removeChannel(participantsChannelRef.current);
      }
    };

}, [user]);

useEffect(() => {
if (!currentConversationId || !user) {
setMessages([]);
setCurrentConversation(null);
return;
}

    setLoadingMessages(true);

    // Find the conversation in our list
    const conversation =
      conversations.find((c) => c.id === currentConversationId) || null;
    setCurrentConversation(conversation);

    // Reset the processed messages set when changing conversations
    processedMessageIdsRef.current = new Set<string>();

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
        // Add all fetched message IDs to the processed set
        data?.forEach((msg) => processedMessageIdsRef.current.add(msg.id));
        setMessages(data || []);
      }

      setLoadingMessages(false);

      // Update last read message if user is a participant
      if (user && conversation && data && data.length > 0) {
        const participant = conversation.participants?.find(
          (p) => p.user_id === user.id
        );
        if (participant) {
          const lastMessageId = data[data.length - 1].id;

          try {
            const { error } = await supabase
              .from("participants")
              .update({ last_read_message_id: lastMessageId })
              .eq("id", participant.id);

            if (error) console.error("Error updating last read:", error);
          } catch (err) {
            console.error("Exception updating last read:", err);
          }
        }
      }
    };

    // fetchMessages();
    const interval = setInterval(fetchMessages, 200);

    return () => clearInterval(interval);

    /* // Clean up previous subscription if exists
    if (messagesChannelRef.current) {
      supabase.removeChannel(messagesChannelRef.current);
      messagesChannelRef.current = null;
    }

    // Set up real-time subscription for messages in the current conversation
     const channel = supabase.channel(`messages_conv_${currentConversationId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: user?.id },
      },
    });

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${currentConversationId}`,
        },
        (payload) => {
          console.log("New message received:", payload);
          const newMessage = payload.new as Message;

          // Force a state update to trigger re-render
          setMessages((currentMessages) => {
            // Check if message already exists to prevent duplicates
            if (processedMessageIdsRef.current.has(newMessage.id)) {
              return currentMessages;
            }

            console.log("Adding new message to state:", newMessage);
            processedMessageIdsRef.current.add(newMessage.id);
            return [...currentMessages, newMessage];
          });

          // Mark as read if this is the current conversation
          if (user && conversation) {
            const participant = conversation.participants?.find(
              (p) => p.user_id === user.id
            );
            if (participant) {
              supabase
                .from("participants")
                .update({ last_read_message_id: newMessage.id })
                .eq("id", participant.id)
                .then(({ error }) => {
                  if (error)
                    console.error("Error marking message as read:", error);
                });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(
          `Subscription status for messages_conv_${currentConversationId}:`,
          status
        );
      });

    messagesChannelRef.current = channel;

    return () => {
      console.log(
        `Removing subscription for messages_conv_${currentConversationId}`
      );
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current);
        messagesChannelRef.current = null;
      }
    }; */

}, [currentConversationId, conversations, user]);
/\*
// Add a global message listener to update conversation list
useEffect(() => {
if (!user) return;

    console.log("Setting up global message listener for all conversations");

    // Clean up previous subscription if exists
    if (globalChannelRef.current) {
      supabase.removeChannel(globalChannelRef.current);
    }

    const globalChannel = supabase.channel("global_messages", {
      config: {
        broadcast: { self: true },
      },
    });

    globalChannel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          console.log("Global new message detected:", newMessage);

          // Only process messages for conversations the user is part of
          if (userConversationIds.includes(newMessage.conversation_id)) {
            console.log("Updating conversation list with new message");

            // Fetch the updated conversation to get all the details
            try {
              const { data: updatedConv, error } = await supabase
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
                .eq("id", newMessage.conversation_id)
                .single();

              if (error) {
                console.error("Error fetching updated conversation:", error);
                return;
              }

              if (updatedConv) {
                // Update the conversations list
                setConversations((prevConvs) => {
                  // Find and update the conversation
                  const updatedConvs = prevConvs.map((conv) => {
                    if (conv.id === newMessage.conversation_id) {
                      return {
                        ...updatedConv,
                        last_message: newMessage,
                        unread_count:
                          currentConversationId === conv.id
                            ? 0
                            : (conv.unread_count || 0) + 1,
                      };
                    }
                    return conv;
                  });

                  // Sort by most recent message
                  return updatedConvs.sort(
                    (a, b) =>
                      new Date(b.updated_at).getTime() -
                      new Date(a.updated_at).getTime()
                  );
                });

                // If this is for the current conversation, add to messages too (redundancy)
                if (newMessage.conversation_id === currentConversationId) {
                  setMessages((currentMessages) => {
                    if (processedMessageIdsRef.current.has(newMessage.id)) {
                      return currentMessages;
                    }
                    processedMessageIdsRef.current.add(newMessage.id);
                    return [...currentMessages, newMessage];
                  });
                }
              }
            } catch (err) {
              console.error("Exception updating conversation list:", err);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log("Global message listener status:", status);
      });

    globalChannelRef.current = globalChannel;

    return () => {
      if (globalChannelRef.current) {
        supabase.removeChannel(globalChannelRef.current);
      }
    };

}, [user, userConversationIds, currentConversationId]); \*/

// Modify the sendMessage function to handle optimistic updates better
const sendMessage = async (text: string, conversationId: string) => {
if (!user) return;

    // Generate a unique temporary ID
    const tempId = `temp-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    // Optimistically add the message to the UI first
    const optimisticMessage = {
      id: tempId,
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

    try {
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
          prevMessages.filter((msg) => msg.id !== tempId)
        );
        return;
      }

      console.log("Message sent successfully:", messageData);

      // Add the real message ID to our processed set
      processedMessageIdsRef.current.add(messageData.id);

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

      // Replace optimistic message with real one
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg.id === tempId ? messageData : msg))
      );
    } catch (err) {
      console.error("Exception while sending message:", err);
      // Remove the optimistic message on exception
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== tempId)
      );
    }

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
