"use client";

import type React from "react";

import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import type { Message } from "@/types";
import { useEffect, useRef, useState } from "react";
import { BsEmojiSmile } from "react-icons/bs";
import { FiSearch } from "react-icons/fi";
import { HiMicrophone } from "react-icons/hi";
import { IoSend } from "react-icons/io5";
import { getAvatarColor } from "@/lib/utils";
import { MdHelp, MdSnippetFolder, MdOutlineSegment } from "react-icons/md";
import { LuBookUp2, LuPenLine } from "react-icons/lu";
import { GrCycle } from "react-icons/gr";
import { IoReorderThreeOutline } from "react-icons/io5";
import { FaHubspot } from "react-icons/fa";
import { GrAttachment } from "react-icons/gr";
import { MdAccessTime } from "react-icons/md";
import { IoTimerOutline } from "react-icons/io5";
import { BsFilePdfFill } from "react-icons/bs";
import { TbCloudDataConnection } from "react-icons/tb";
import { BsStars } from "react-icons/bs";
import Image from "next/image";
import { IoIosCode } from "react-icons/io";

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
      <div className="flex h-full">
        <div className="flex-1 flex items-center justify-center bg-[#f0f2f5]">
          <div className="text-center text-gray-500">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#f0f2f5] rounded-full flex items-center justify-center border-2 border-[#00a884]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#00a884"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </div>
            <p className="text-xl font-light mb-2">
              Select a chat to start messaging
            </p>
            <p className="text-sm">Or create a new conversation</p>
          </div>
        </div>

        {/* Right Navigation Sidebar */}
        {/* Top 6 buttons */}
        <div className="w-8 bg-[#f0f2f5] flex flex-col justify-between py-1 border-l border-[#d1d7db]">
          {/* Top 6 buttons */}
          <div className="flex flex-col space-y-3">
            <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#aebac1] hover:text-white transition-colors">
              <LuBookUp2 size={20} />
            </button>
            <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#aebac1] hover:text-white transition-colors">
              <GrCycle size={20} />
            </button>
            <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#aebac1] hover:text-white transition-colors">
              <LuPenLine size={20} />
            </button>
            <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#aebac1] hover:text-white transition-colors">
              <IoReorderThreeOutline size={20} />
            </button>
            <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#aebac1] hover:text-white transition-colors">
              <MdHelp size={20} />
            </button>
            <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#aebac1] hover:text-white transition-colors">
              <FaHubspot size={20} />
            </button>
            <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#aebac1] hover:text-white transition-colors">
              <MdHelp size={20} />
            </button>
            <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#aebac1] hover:text-white transition-colors">
              <MdSnippetFolder size={20} />
            </button>
            <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#aebac1] hover:text-white transition-colors">
              <MdOutlineSegment size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main Chat Window */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="flex justify-between items-center px-4 py-2 bg-[#f0f2f5] border-l border-[#d1d7db]">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              <div
                className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ${getAvatarColor(
                  getConversationName()
                )}`}
              >
                <span className="text-white font-semibold text-lg">
                  {getConversationName().charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              <h2 className="font-medium text-[#111b21]">
                {getConversationName()}
              </h2>
              <p className="text-xs text-[#667781]">
                {currentConversation?.participants?.find(
                  (p) => p.user_id !== user?.id
                )?.user?.status || "last seen recently"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-[#54656f]">
            <button className="p-1 rounded-full hover:bg-[#e9edef]">
              <BsStars size={22} />
            </button>
            <button className="p-1 rounded-full hover:bg-[#e9edef]">
              <FiSearch size={20} />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div
          className="flex-1 overflow-y-auto p-4 bg-[#efeae2]"
          style={{
            // backgroundImage: "url('/chat-background.png')",
            backgroundSize: "contain",
          }}
        >
          {loadingMessages ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-[#54656f]">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-[#54656f]">
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
                      ? "bg-[#d9fdd3] text-[#111b21]"
                      : "bg-white text-[#111b21]"
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-[10px] text-right mt-1 text-[#667781]">
                    {formatMessageTime(message.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-[#f0f2f5]">
          {/* Top row - Input */}
          <div className="px-4 py-2">
            <form onSubmit={handleSendMessage} className="flex items-center">
              <input
                type="text"
                placeholder="Message..."
                className="flex-1 py-2 px-4 rounded-lg bg-white border-none focus:outline-none mx-2 text-gray-900"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button
                type="button"
                className="p-2 text-[#54656f] hover:text-[#00a884]"
                onClick={() => handleSendMessage()}
              >
                <IoSend size={22} />
              </button>
            </form>
          </div>

          {/* Bottom row - Additional buttons */}
          <div className="px-4  border-t border-[#e9edef] pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-2 text-[#54656f] hover:text-[#00a884] text-sm">
                  <GrAttachment size={18} />
                </button>
                <button className="flex items-center space-x-2 text-[#54656f] hover:text-[#00a884] text-sm">
                  <BsEmojiSmile size={18} />
                </button>
                <button className="flex items-center space-x-2 text-[#54656f] hover:text-[#00a884] text-sm">
                  <MdAccessTime size={18} />
                </button>
                <button className="flex items-center space-x-2 text-[#54656f] hover:text-[#00a884] text-sm">
                  <IoTimerOutline size={18} />
                </button>
                <button className="flex items-center space-x-2 text-[#54656f] hover:text-[#00a884] text-sm">
                  <TbCloudDataConnection size={18} />
                </button>
                <button className="flex items-center space-x-2 text-[#54656f] hover:text-[#00a884] text-sm">
                  <BsFilePdfFill size={18} />
                </button>
                <button className="flex items-center space-x-2 text-[#54656f] hover:text-[#00a884] text-sm">
                  <HiMicrophone size={18} />
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button className="flex items-center bg-gray-400 text-white space-x-2 text-[#54656f] hover:text-[#00a884] text-xs border border-[#aebac1] px-1 py-1 pb-1 rounded-md gap-8">
                  <Image src="/logo.svg" alt="Logo" height={20} width={70} />
                  <IoIosCode size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Navigation Sidebar */}
      <div className="w-8 bg-[#f0f2f5] flex flex-col justify-between py-1 border-l border-[#d1d7db]">
        {/* Top 6 buttons */}
        <div className="flex flex-col space-y-3">
          <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#aebac1] hover:text-white transition-colors">
            <LuBookUp2 size={20} />
          </button>
          <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#aebac1] hover:text-white transition-colors">
            <GrCycle size={20} />
          </button>
          <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#aebac1] hover:text-white transition-colors">
            <LuPenLine size={20} />
          </button>
          <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#aebac1] hover:text-white transition-colors">
            <IoReorderThreeOutline size={20} />
          </button>
          <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#aebac1] hover:text-white transition-colors">
            <MdHelp size={20} />
          </button>
          <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#aebac1] hover:text-white transition-colors">
            <FaHubspot size={20} />
          </button>
          <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#aebac1] hover:text-white transition-colors">
            <MdHelp size={20} />
          </button>
          <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#aebac1] hover:text-white transition-colors">
            <MdSnippetFolder size={20} />
          </button>
          <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#aebac1] hover:text-white transition-colors">
            <MdOutlineSegment size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
