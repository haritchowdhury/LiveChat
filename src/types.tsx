export type User = {
  id: string;
  email?: string;
  name: string;
  avatar_url?: string;
  phone?: string;
  status?: string;
  created_at?: string;
  last_seen?: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  text?: string;
  created_at: string;
  read_by: string[];
  type: "TEXT" | "IMAGE" | "VOICE" | "CLIENT" | string;
  //asset_url?: string;
  is_pinned: boolean;
};

export type Conversation = {
  id: string;
  name?: string;
  is_group: boolean;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  last_message_id?: string;
  participants?: Participant[];
  last_message?: Message;
  unread_count?: number;
  isCreated: boolean;
};

export type Participant = {
  id: string;
  user_id: string;
  conversation_id: string;
  joined_at: string;
  last_read_message_id?: string;
  user?: User;
};

export type ParticipantWithConversation = {
  conversation_id: string;
  conversation: {
    is_group: boolean;
  };
};

export type AuthUser = {
  id: string;
  email: string;
  user_metadata: {
    name: string;
    avatar_url?: string;
  };
};

export type ChatContextType = {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loadingMessages: boolean;
  loadingConversations: boolean;
  sendMessage: (text: string, conversationId: string) => Promise<void>;
  setCurrentConversationId: (id: string | null) => void;
  currentConversationId: string | null;
  handleCreateNewChat: (userId: string) => Promise<void>;
};

export type SharedConversation = {
  conversation_id: string;
  conversation: {
    is_group: boolean;
  } | null;
};
