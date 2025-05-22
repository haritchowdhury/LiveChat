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
import { getAvatarColor } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { Console } from "console";

export const Sidebar: React.FC = () => {
const { user, signOut } = useAuth();
const {
conversations,
setCurrentConversationId,
currentConversationId,
handleCreateNewChat,
} = useChat();
const [searchTerm, setSearchTerm] = useState("");

console.log("conversations at sidebar", conversations);

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

return (
<div className="flex flex-col h-full bg-sidebar-background border-r relative">
{/_ Sidebar Header _/}
<div onClick={() => signOut()}>Signout</div>
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
        {filteredConversations?.map((conversation) => (
          <div
            key={conversation.id}
            className={`flex px-3 py-3 border-b border-gray-100 cursor-pointer ${
              currentConversationId === conversation.id
                ? "bg-chat-item-hover"
                : "hover:bg-chat-item-hover"
            }`}
            onClick={
              () =>
                // Changed this part
                conversation.isCreated
                  ? handleConversationClick(conversation.id)
                  : handleCreateNewChat(conversation.id)

              //handleConversationClick(conversation.id)
            }
          >
            {/* Avatar */}
            <div className="flex-shrink-0 mr-3">
              <div
                className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center ${getAvatarColor(
                  getConversationName(conversation as any)
                )}`}
              >
                <span className="text-white font-semibold text-lg">
                  {getConversationName(conversation as any)
                    .charAt(0)
                    .toUpperCase()}
                </span>
              </div>
            </div>

            {/* Chat info */}
            <div className="flex-1 min-w-0">
              <div className={`flex justify-between items-cente `}>
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
          className="bg-teal-500 hover:bg-teal-600 text-white rounded-full p-3 shadow-lg transition-colors"
          aria-label="New chat"
        >
          <MdAdd size={24} />
        </button>
      </div>
    </div>

);
};
