"use client";

import type React from "react";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import type { Conversation } from "@/types";
import moment from "moment";
import { useState } from "react";
import {
  MdSettings,
  MdHelp,
  MdFormatListBulleted,
  MdOutlineChecklist,
} from "react-icons/md";
import { IoMdHome } from "react-icons/io";
import { IoChatbubbleEllipsesSharp, IoTicket, IoFilter } from "react-icons/io5";
import { BsGraphUpArrow, BsFilter } from "react-icons/bs";
import { PiGitForkFill, PiFolderFill } from "react-icons/pi";
import { RiContactsBookFill, RiChatNewLine } from "react-icons/ri";
import { LuBookDown } from "react-icons/lu";
import { TbStarsFilled } from "react-icons/tb";
import { FaFolderPlus } from "react-icons/fa6";
import { ImCancelCircle } from "react-icons/im";
import { FiSearch } from "react-icons/fi";
import { getAvatarColor } from "@/lib/utils";

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const {
    conversations,
    setCurrentConversationId,
    currentConversationId,
    handleCreateNewChat,
  } = useChat();
  const [searchTerm, setSearchTerm] = useState("");

  console.log("conversations", conversations);

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
    <div className="flex h-full">
      {/* Left Navigation Sidebar */}
      <div className="w-8 bg-[#f0f2f5] flex flex-col  justify-between py-4">
        {/* Top 6 buttons */}
        <div className="flex flex-col space-y-3">
          <button className="p-1 rounded-lg hover:bg-[#3c4249] text-[#54656f] hover:text-white transition-colors">
            <IoMdHome size={16} />
          </button>
          <button className="p-1 rounded-lg hover:bg-[#3c4249] text-[#00a884] hover:text-white transition-colors">
            <IoChatbubbleEllipsesSharp size={16} />
          </button>
          <button className="p-1 rounded-lg hover:bg-[#3c4249] text-[#54656f] hover:text-white transition-colors">
            <IoTicket size={16} />
          </button>
          <button className="p-1 rounded-lg hover:bg-[#3c4249] text-[#54656f] hover:text-white transition-colors">
            <BsGraphUpArrow size={16} />
          </button>
          <button className="p-1 rounded-lg hover:bg-[#3c4249] text-[#54656f] hover:text-white transition-colors">
            <MdFormatListBulleted size={16} />
          </button>
          <button className="p-1 rounded-lg hover:bg-[#3c4249] text-[#54656f] hover:text-white transition-colors">
            <PiGitForkFill size={16} />
          </button>
          <button className="p-1 rounded-lg hover:bg-[#3c4249] text-[#54656f] hover:text-white transition-colors">
            <RiContactsBookFill size={16} />
          </button>
          <button className="p-1 rounded-lg hover:bg-[#3c4249] text-[#54656f] hover:text-white transition-colors">
            <MdHelp size={16} />
          </button>
          <button className="p-1 rounded-lg hover:bg-[#3c4249] text-[#54656f] hover:text-white transition-colors">
            <PiFolderFill size={16} style={{ transform: "scaleX(-1)" }} />
          </button>
          <button className="p-1 rounded-lg hover:bg-[#3c4249] text-[#54656f]hover:text-white transition-colors">
            <MdOutlineChecklist size={16} style={{ transform: "scaleX(-1)" }} />
          </button>

          <button className="p-1 rounded-lg hover:bg-[#3c4249] text-[#54656f] hover:text-white transition-colors">
            <MdSettings size={16} />
          </button>
        </div>

        {/* Bottom 2 buttons */}
        <div className="flex flex-col space-y-3">
          <button className="p-1 rounded-lg hover:bg-[#3c4249] text-[#54656f] hover:text-white transition-colors">
            <TbStarsFilled size={16} />
          </button>
          <button className="p-1 rounded-lg hover:bg-[#3c4249] text-[#54656f] hover:text-white transition-colors">
            <LuBookDown size={16} />
          </button>
        </div>
      </div>

      {/* Main Sidebar */}
      <div className="flex flex-col flex-1 bg-white relative border-l border-[#d1d7db]">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between bg-[#f0f2f5] px-1 py-2">
          {/* Left group */}
          <div className="flex items-center space-x-3">
            <button className="flex items-center gap-1 rounded-md bg-white px-1 py-1 text-xs text-[#00a884] hover:bg-[#3c4249] hover:text-white transition-colors">
              <FaFolderPlus size={14} />
              <span>Custom filter</span>
            </button>
            <button className="flex items-center gap-1 rounded-md bg-white px-1 py-1 text-xs text-gray-600 hover:bg-[#3c4249] hover:text-white transition-colors">
              <span>Save</span>
            </button>
          </div>
          <div className="flex-grow" />

          {/* Right group */}
          <div className="relative">
            <button className="relative flex items-center gap-1 rounded-md bg-white px-3 py-1 text-xs text-[#00a884] hover:bg-[#3c4249] hover:text-white transition-colors">
              <IoFilter size={14} />
              <span>Filtered</span>

              {/* Close icon */}
              <span className="absolute -top-1 -right-1 text-[#00a884] text-gray-400 hover:text-red-500 cursor-pointer bg-white rounded-full px-[2px] leading-none shadow-sm">
                <ImCancelCircle className="text-[#00a884]" />
              </span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-3 py-2 bg-white">
          <div className="relative">
            <input
              type="text"
              placeholder="Search or start new chat"
              className="w-full px-10 py-1.5 bg-gray-100 rounded-lg text-sm focus:outline-none text-gray-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#54656f]"
              size={18}
            />
            <BsFilter
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#54656f]"
              size={22}
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations?.map((conversation) => (
            <div
              key={conversation.id}
              className={`flex px-3 py-3 border-b border-[#e9edef] cursor-pointer ${
                currentConversationId === conversation.id
                  ? "bg-[#f0f2f5]"
                  : "hover:bg-[#f5f6f6]"
              }`}
              onClick={() =>
                conversation.isCreated
                  ? handleConversationClick(conversation.id)
                  : handleCreateNewChat(conversation.id)
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
                <div className="flex justify-between items-center">
                  <span className="font-medium truncate text-[#111b21]">
                    {getConversationName(conversation as any)}
                  </span>
                  <span className="text-xs text-[#667781]">
                    {getLastMessageTime(conversation as any)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-[#667781] truncate">
                    {getLastMessagePreview(conversation as any)}
                  </p>
                  {conversation.unread_count &&
                  conversation.unread_count > 0 ? (
                    <span className="bg-[#00a884] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
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
            className="bg-[#00a884] hover:bg-[#008f72] text-white rounded-full p-3 shadow-lg transition-colors"
            aria-label="New chat"
          >
            <RiChatNewLine size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};
