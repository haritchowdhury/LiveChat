import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { Message } from "@/types";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { BsEmojiSmile, BsThreeDotsVertical } from "react-icons/bs";
import { FiPaperclip, FiSearch } from "react-icons/fi";
import { HiMicrophone } from "react-icons/hi";
import { IoSend } from "react-icons/io5";
import { MdOutlineDoNotDisturbOn } from "react-icons/md";
import { getAvatarColor } from "@/lib/utils";

export const ChatWindow: React.FC = () => {
const { user } = useAuth();
const {
currentConversation,
messages,
sendMessage,
currentConversationId,
loadingMessages,
} = useChat();
const [newMessage, setNewMessage] = useState("");
const messagesEndRef = useRef<HTMLDivElement>(null);

// Scroll to bottom of messages when messages change
useEffect(() => {
if (messagesEndRef.current) {
messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
}
}, [messages]);

const handleSendMessage = async (e?: React.FormEvent) => {
if (e) e.preventDefault();

    if (!newMessage.trim() || !currentConversationId) return;

    await sendMessage(newMessage, currentConversationId);
    setNewMessage("");

};

const getConversationName = (): string => {
if (!currentConversation) return "";

    if (currentConversation.name) return currentConversation.name;

    // For one-on-one conversations, use the other person's name
    const otherParticipant = currentConversation.participants?.find(
      (p) => p.user_id !== user?.id
    );
    return otherParticipant?.user?.name || "Unknown User";

};

const formatMessageTime = (timestamp: string): string => {
const date = new Date(timestamp);
return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const isUserMessage = (message: Message): boolean => {
return message.sender_id === user?.id;
};

if (!currentConversationId) {
return (
<div className="flex-1 flex items-center justify-center bg-chat-background">
<div className="text-center text-gray-500">
<p className="text-xl font-light mb-2">
Select a chat to start messaging
</p>
<p className="text-sm">Or create a new conversation</p>
</div>
</div>
);
}

return (
<div className="flex flex-col h-full">
{/_ Chat Header _/}
<div className="flex justify-between items-center px-4 py-2 bg-chat-header border-l border-gray-200">
<div className="flex items-center">
<div className="flex-shrink-0 mr-3">
<div
className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center ${getAvatarColor(
                getConversationName()
              )}`} >
<span className="text-white font-semibold text-lg">
{getConversationName().charAt(0).toUpperCase()}
</span>
</div>
</div>
<div>
<h2 className="font-medium">{getConversationName()}</h2>
<p className="text-xs text-gray-500">
{currentConversation?.participants?.find(
(p) => p.user_id !== user?.id
)?.user?.status || "last seen recently"}
</p>{" "} \*
</div>
</div>

        <div className="flex items-center space-x-4 text-gray-600">
          <button className="p-1 rounded-full hover:bg-gray-200">
            <FiSearch size={20} />
          </button>
          <button className="p-1 rounded-full hover:bg-gray-200">
            <MdOutlineDoNotDisturbOn size={22} />
          </button>
          <button className="p-1 rounded-full hover:bg-gray-200">
            <BsThreeDotsVertical size={20} />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 bg-chat-background"
        style={{
          backgroundImage: "url('/chat-background.png')",
          backgroundSize: "contain",
        }}
      >
        {loadingMessages ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">
              No messages yet. Start a conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex mb-2 ${
                isUserMessage(message) ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[65%] px-3 py-2 rounded-lg ${
                  isUserMessage(message)
                    ? "bg-outgoing-message text-white"
                    : "bg-incoming-message"
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs text-right mt-1 opacity-70">
                  {formatMessageTime(message.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="px-4 py-2 bg-chat-footer">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <button
            type="button"
            className="p-2 text-gray-600 hover:text-gray-800"
          >
            <BsEmojiSmile size={22} />
          </button>
          <button
            type="button"
            className="p-2 text-gray-600 hover:text-gray-800"
          >
            <FiPaperclip size={22} />
          </button>
          <input
            type="text"
            placeholder="Type a message"
            className="flex-1 py-2 px-4 rounded-full bg-white border-none focus:outline-none mx-2"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            type="button"
            className="p-2 text-gray-600 hover:text-gray-800"
            onClick={() => handleSendMessage()}
          >
            {newMessage.trim() ? (
              <IoSend size={22} />
            ) : (
              <HiMicrophone size={22} />
            )}
          </button>
        </form>
      </div>
    </div>

);
};
