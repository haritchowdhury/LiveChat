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
  ChatContextType,
  SharedConversation,
} from "@/types";
import { useAuth } from "./AuthContext";

const ChatContext = createContext<ChatContextType>({
  conversations: [],
  currentConversation: null,
  messages: [],
  loadingMessages: false,
  loadingConversations: false,
  sendMessage: async () => {},
  setCurrentConversationId: () => {},
  currentConversationId: null,
  handleCreateNewChat: async () => {},
});

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const { user } = useAuth();

  // Add ref for processed message IDs
  const processedMessageIdsRef = useRef<Set<string>>(new Set());

  // UseEffect to get the Conversations
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
        // return;
      }

      const conversationIds = (participations || [])?.map(
        (p) => p.conversation_id
      );
      // setUserConversationIds(conversationIds); // Store the IDs for later use

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

      let conversationsWithLastMessage: Conversation[] = [];

      if (conversationsError) {
        console.error(
          "Error fetching conversation details:",
          conversationsError
        );
        // setLoadingConversations(false);
        // return;
      } else {
        // Set the current conversation if conversation data exists

        // Get last messages for each conversation
        conversationsWithLastMessage = await Promise.all(
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
                const { data: lastReadMessage, error: lastReadError } =
                  await supabase
                    .from("messages")
                    .select("created_at")
                    .eq("id", currentUserParticipant.last_read_message_id)
                    .single();

                if (!lastReadError && lastReadMessage?.created_at) {
                  // Now use that timestamp to count newer messages
                  const { count, error } = await supabase
                    .from("messages")
                    .select("*", { count: "exact", head: true })
                    .eq("conversation_id", conversation.id)
                    .gt("created_at", lastReadMessage.created_at);

                  if (!error && count !== null) {
                    unreadCount = count;
                  }
                }
              }

              return {
                ...conversation,
                last_message: lastMessage || null,
                unread_count: unreadCount || 0,
                isCreated: true,
              };
            }
            return {
              ...conversation,
              last_message: null,
              unread_count: 0,
              isCreated: true,
            };
          })
        );
      }

      // Fetch all users who don't share a conversation with current user
      const { data: allOtherUsers, error: usersError } = await supabase
        .from("users")
        .select("id, name")
        .neq("id", user.id);

      if (usersError) {
        console.error("Error fetching users:", usersError);
        setConversations(conversationsWithLastMessage);
        setLoadingConversations(false);
        return;
      }

      // Get user IDs that current user already shares a conversation with
      const sharedUserIds = new Set<string>();
      conversationsWithLastMessage.forEach((conversation) => {
        conversation.participants?.forEach((p: any) => {
          if (p.user_id !== user.id) {
            sharedUserIds.add(p.user_id);
          }
        });
      });

      // Prepare "pseudo-conversations"
      const pseudoConversations = allOtherUsers
        .filter((u) => !sharedUserIds.has(u.id))
        .map((u) => ({
          id: u.id, // <- user_id as id
          name: u.name,
          is_group: false,
          created_at: "",
          updated_at: "",
          avatar_url: "",
          last_message_id: undefined,
          participants: undefined,
          last_message: undefined,
          unread_count: 0,
          isCreated: false,
        }));

      setConversations([
        ...conversationsWithLastMessage,
        ...pseudoConversations,
      ]);

      setLoadingConversations(false);
    };

    fetchConversations();
  }, [user]);

  // UseEffect to get the current conversation messages
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
  }, [currentConversationId, conversations, user]);

  // Send Message Function
  const sendMessage = async (text: string, conversationId: string) => {
    if (!user) return;

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
    } catch (err) {
      console.error("Exception while sending message:", err);
    }
  };

  const handleCreateNewChat = async (userId: string): Promise<void> => {
    if (!userId) return;

    try {
      // First check if there's already a conversation with this user
      const { data: existingConversations } = await supabase
        .from("participants")
        .select("conversation_id")
        .eq("user_id", user?.id);

      if (existingConversations && existingConversations.length > 0) {
        const conversationIds = existingConversations.map(
          (p) => p.conversation_id
        );

        const { data, error } = await supabase
          .from("participants")
          .select("conversation_id, conversation:conversations(is_group)")
          .eq("user_id", userId)
          .in("conversation_id", conversationIds);

        if (error) {
          console.error("Supabase error:", error);
        }

        const sharedConversations = data as SharedConversation[] | null;
        // Check if there's a direct (non-group) conversation
        const existingDirectConvo = sharedConversations?.find(
          (p) => p.conversation && !p.conversation.is_group
        );

        if (existingDirectConvo) {
          setCurrentConversationId(existingDirectConvo.conversation_id);
          return;
        }
      }

      // Create a new conversation
      const { data: conversationData, error: conversationError } =
        await supabase
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
      console.log("both users:", user?.id, userId);
      // Add both users as participants
      const { error: participantsError } = await supabase
        .from("participants")
        .insert([
          { user_id: user?.id, conversation_id: conversationId },
          { user_id: userId, conversation_id: conversationId },
        ]);

      if (participantsError) {
        console.error("Participants error:", participantsError);
        throw new Error("Failed to add participants to conversation");
      }

      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error("Create conversation error:", error);
    }
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
        handleCreateNewChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  return useContext(ChatContext);
};
