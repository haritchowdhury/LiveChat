import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { Conversation, User } from "@/types";
import moment from "moment";
import Image from "next/image";
import { useState, useEffect } from "react";
import { BsThreeDotsVertical, BsFilter } from "react-icons/bs";
import { FiSearch } from "react-icons/fi";
import {
MdGroups,
MdMessage,
MdOutlineDonutLarge,
MdAdd,
} from "react-icons/md";
import { supabase } from "@/lib/supabaseClient";

type SharedConversation = {
conversation_id: string;
conversation: {
is_group: boolean;
} | null;
};
export const Sidebar: React.FC = () => {
const { user } = useAuth();
const {
conversations,
setCurrentConversationId,
currentConversationId,
createConversation,
} = useChat();
const [searchTerm, setSearchTerm] = useState("");
const [showNewChatModal, setShowNewChatModal] = useState(false);
const [newChatSearch, setNewChatSearch] = useState("");
const [searchResults, setSearchResults] = useState<User[]>([]);
const [isCreatingChat, setIsCreatingChat] = useState(false);
const [errorMessage, setErrorMessage] = useState("");
const [isSearching, setIsSearching] = useState(false);

const filteredConversations = searchTerm
? conversations.filter(
(convo) =>
convo.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
convo.participants?.some(
(p) =>
p.user_id !== user?.id &&
p.user?.name.toLowerCase().includes(searchTerm.toLowerCase())
)
)
: conversations;

const handleConversationClick = (conversationId: string) => {
setCurrentConversationId(conversationId);
};

const getConversationName = (conversation: Conversation): string => {
if (conversation.name) return conversation.name;

    // For one-on-one conversations, use the other person's name
    const otherParticipant = conversation.participants?.find(
      (p) => p.user_id !== user?.id
    );
    return otherParticipant?.user?.name || "Unknown User";

};

const getConversationAvatar = (conversation: Conversation): string => {
if (conversation.avatar_url) return conversation.avatar_url;

    // For one-on-one conversations, use the other person's avatar
    const otherParticipant = conversation.participants?.find(
      (p) => p.user_id !== user?.id
    );
    return otherParticipant?.user?.avatar_url || "/default-avatar.png";

};

const getLastMessagePreview = (conversation: Conversation): string => {
if (!conversation.last_message) return "";
return (
conversation.last_message.text ||
`[${conversation.last_message.type}]` ||
""
);
};

const getLastMessageTime = (conversation: Conversation): string => {
if (!conversation.last_message?.created_at) return "";
const date = new Date(conversation.last_message.created_at);
const today = new Date();
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      // Today, show time
      return moment(date).format("HH:mm");
    } else if (date.toDateString() === yesterday.toDateString()) {
      // Yesterday
      return "Yesterday";
    } else if (today.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      // Within the last week, show day name
      return moment(date).format("ddd");
    } else {
      // Older, show date
      return moment(date).format("DD/MM/YYYY");
    }

};

const searchUsers = async (query: string) => {
if (!query.trim() || query.length < 2) {
setSearchResults([]);
return;
}

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, avatar_url")
        .ilike("name", `%${query}%`)
        .limit(10);

      if (error) {
        console.error("Error searching users:", error);
        return;
      }

      // Make sure we filter out the current user from results
      const filteredResults = (data || []).filter((u) => u.id !== user?.id);
      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearching(false);
    }

};

// Debounce search to avoid too many requests
useEffect(() => {
const timer = setTimeout(() => {
searchUsers(newChatSearch);
}, 300);

    return () => clearTimeout(timer);

}, [newChatSearch]);

/\* const handleCreateNewChat = async (userId: string) => {
if (!userId) return;

    setIsCreatingChat(true);
    setErrorMessage("");

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
          setShowNewChatModal(false);
          setNewChatSearch("");
          setSearchResults([]);
          setIsCreatingChat(false);
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
      setShowNewChatModal(false);
      setNewChatSearch("");
      setSearchResults([]);
    } catch (error) {
      console.error("Create conversation error:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to create conversation"
      );
    } finally {
      setIsCreatingChat(false);
    }

}; \*/

return (
<div className="flex flex-col h-full bg-sidebar-background border-r relative">
{/_ Sidebar Header _/}
<div className="flex justify-between items-center px-4 py-3 bg-sidebar-header">
<div className="flex items-center">
<div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
{user?.user_metadata.avatar_url ? (
<Image
src={user.user_metadata.avatar_url}
alt={user.user_metadata.name || "User"}
width={40}
height={40}
/>
) : (
<div className="w-full h-full flex items-center justify-center text-gray-500">
{(user?.user_metadata.name || "U").charAt(0)}
</div>
)}
</div>
</div>

        <div className="flex items-center space-x-4 text-gray-600">
          <button className="p-1 rounded-full hover:bg-gray-200">
            <MdGroups size={22} />
          </button>
          <button className="p-1 rounded-full hover:bg-gray-200">
            <MdOutlineDonutLarge size={22} />
          </button>
          <button className="p-1 rounded-full hover:bg-gray-200">
            <MdMessage size={22} />
          </button>
          <button className="p-1 rounded-full hover:bg-gray-200">
            <BsThreeDotsVertical size={20} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3 py-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search or start new chat"
            className="w-full px-10 py-2 bg-sidebar-header rounded-lg text-sm focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FiSearch
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            size={18}
          />
          <BsFilter
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            size={22}
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`flex px-3 py-3 border-b border-gray-100 cursor-pointer ${
              currentConversationId === conversation.id
                ? "bg-chat-item-hover"
                : "hover:bg-chat-item-hover"
            }`}
            onClick={() => createConversation(conversation.id)}
          >
            {/* Avatar */}
            <div className="flex-shrink-0 mr-3">
              <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden">
                <Image
                  src={getConversationAvatar(conversation as any)}
                  alt={getConversationName(conversation as any)}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
            </div>

            {/* Chat info */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className="font-medium truncate">
                  {getConversationName(conversation as any)}
                </span>
                <span className="text-xs text-gray-500">
                  {getLastMessageTime(conversation as any)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600 truncate">
                  {getLastMessagePreview(conversation as any)}
                </p>
                {conversation.unread_count && conversation.unread_count > 0 ? (
                  <span className="bg-unread-bg text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {conversation.unread_count}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Chat Button (fixed at bottom right) */}
      <div className="absolute bottom-4 right-4">
        <button
          onClick={() => setShowNewChatModal(true)}
          className="bg-teal-500 hover:bg-teal-600 text-white rounded-full p-3 shadow-lg transition-colors"
          aria-label="New chat"
        >
          <MdAdd size={24} />
        </button>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Start New Conversation</h3>

            <div className="mb-4">
              <label
                htmlFor="userSearch"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Search for a user
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="userSearch"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Search by name"
                  value={newChatSearch}
                  onChange={(e) => setNewChatSearch(e.target.value)}
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-500"></div>
                  </div>
                )}
              </div>

              {errorMessage && (
                <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-md max-h-60 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() =>
                        !isCreatingChat && createConversation(user.id)
                      }
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden mr-3">
                        {user.avatar_url ? (
                          <Image
                            src={user.avatar_url}
                            alt={user.name || "User"}
                            width={32}
                            height={32}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            {(user.name || "U").charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium">
                        {user.name || "Unknown User"}
                      </span>
                      {isCreatingChat && (
                        <div className="ml-auto">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-500"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {newChatSearch.length >= 2 &&
                searchResults.length === 0 &&
                !isSearching && (
                  <p className="text-gray-500 text-sm mt-2">No users found</p>
                )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                onClick={() => {
                  setShowNewChatModal(false);
                  setNewChatSearch("");
                  setSearchResults([]);
                  setErrorMessage("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

);
};
