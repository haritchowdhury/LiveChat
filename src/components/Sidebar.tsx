/* 
"use client";

import type React from "react";

import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import type { Conversation } from "@/types";
import moment from "moment";
import Image from "next/image";
import { useState } from "react";
import { BsThreeDotsVertical, BsFilter } from "react-icons/bs";
import { FiSearch } from "react-icons/fi";
import {
  MdGroups,
  MdMessage,
  MdOutlineDonutLarge,
  MdAdd,
} from "react-icons/md";
import { getAvatarColor } from "@/lib/utils";

export const Sidebar: React.FC = () => {
  const { user, signOut } = useAuth();
  const {
    conversations,
    setCurrentConversationId,
    currentConversationId,
    handleCreateNewChat,
  } = useChat();
  const [searchTerm, setSearchTerm] = useState("");

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
    <div className="flex flex-col h-full bg-white">
      / Sidebar Header 
      <div className="flex justify-between items-center px-4 py-3 bg-[#f0f2f5]">
        <div className="flex items-center">
          <div
            className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden cursor-pointer"
            onClick={() => signOut()}
          >
            {user?.user_metadata.avatar_url ? (
              <Image
                src={user.user_metadata.avatar_url || "/placeholder.svg"}
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

        <div className="flex items-center space-x-3 text-[#54656f]">
          <button className="p-1 rounded-full hover:bg-[#e9edef]">
            <MdGroups size={22} />
          </button>
          <button className="p-1 rounded-full hover:bg-[#e9edef]">
            <MdOutlineDonutLarge size={22} />
          </button>
          <button className="p-1 rounded-full hover:bg-[#e9edef]">
            <MdMessage size={22} />
          </button>
          <button className="p-1 rounded-full hover:bg-[#e9edef]">
            <BsThreeDotsVertical size={20} />
          </button>
        </div>
      </div>

      / Search Bar 
      <div className="px-3 py-2 bg-white">
        <div className="relative">
          <input
            type="text"
            placeholder="Search or start new chat"
            className="w-full px-10 py-1.5 bg-[#f0f2f5] rounded-lg text-sm focus:outline-none"
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

      / Conversations List 
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
            / Avatar 
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

            / Chat info 
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
                {conversation.unread_count && conversation.unread_count > 0 ? (
                  <span className="bg-[#00a884] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {conversation.unread_count}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      / New Chat Button (fixed at bottom right) 
      <div className="absolute bottom-4 right-4">
        <button
          className="bg-[#00a884] hover:bg-[#008f72] text-white rounded-full p-3 shadow-lg transition-colors"
          aria-label="New chat"
        >
          <MdAdd size={24} />
        </button>
      </div>
    </div>
  );
}; */

"use client";

import type React from "react";

import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import type { Conversation } from "@/types";
import moment from "moment";
import Image from "next/image";
import { useState } from "react";
import { BsThreeDotsVertical, BsFilter } from "react-icons/bs";
import { FiSearch } from "react-icons/fi";
import {
  MdGroups,
  MdMessage,
  MdOutlineDonutLarge,
  MdAdd,
  MdHome,
  MdChat,
  MdNotifications,
  MdSettings,
  MdPerson,
  MdFavorite,
  MdHelp,
  MdLogout,
} from "react-icons/md";
import { getAvatarColor } from "@/lib/utils";
import { IoMdHome } from "react-icons/io";
import { IoChatbubbleEllipsesSharp, IoTicket } from "react-icons/io5";
import { BsGraphUpArrow } from "react-icons/bs";
import { MdFormatListBulleted, MdOutlineChecklist } from "react-icons/md";
import { PiGitForkFill, PiFolderFill } from "react-icons/pi";
import { RiContactsBookFill } from "react-icons/ri";
import { LuBookDown } from "react-icons/lu";
import { TbStarsFilled } from "react-icons/tb";
import { FaFolderPlus } from "react-icons/fa6";
import { IoFilter } from "react-icons/io5";
import { ImCancelCircle } from "react-icons/im";
import { RiChatNewLine } from "react-icons/ri";

export const Sidebar: React.FC = () => {
  const { user, signOut } = useAuth();
  const {
    conversations,
    setCurrentConversationId,
    currentConversationId,
    handleCreateNewChat,
  } = useChat();
  const [searchTerm, setSearchTerm] = useState("");

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
    <div className="flex">
      {/* Left Navigation Sidebar */}
      <div className="w-8 bg-[#f0f2f5] flex flex-col justify-between ">
        {/* Top 6 buttons */}
        <div className="flex flex-col space-y-3">
          <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#54656f] hover:text-white transition-colors">
            <IoMdHome size={20} />
          </button>
          <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#00a884] hover:text-white transition-colors">
            <IoChatbubbleEllipsesSharp size={20} />
          </button>
          <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#54656f] hover:text-white transition-colors">
            <IoTicket size={20} />
          </button>
          <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#54656f] hover:text-white transition-colors">
            <BsGraphUpArrow size={20} />
          </button>
          <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#54656f] hover:text-white transition-colors">
            <MdFormatListBulleted size={20} />
          </button>
          <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#54656f] hover:text-white transition-colors">
            <PiGitForkFill size={20} style={{ transform: "scaleX(-1)" }} />
          </button>
          <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#54656f] hover:text-white transition-colors">
            <RiContactsBookFill size={20} style={{ transform: "scaleX(-1)" }} />
          </button>
          <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#54656f] hover:text-white transition-colors">
            <MdHelp size={20} />
          </button>
          <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#54656f] hover:text-white transition-colors">
            <PiFolderFill size={20} style={{ transform: "scaleX(-1)" }} />
          </button>
          <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#54656f]hover:text-white transition-colors">
            <MdOutlineChecklist size={20} style={{ transform: "scaleX(-1)" }} />
          </button>
          <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#54656f] hover:text-white transition-colors">
            <MdSettings size={20} />
          </button>
        </div>

        {/* Bottom 2 buttons */}
        <div className="flex flex-col space-y-3">
          <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#54656f] hover:text-white transition-colors">
            <TbStarsFilled size={20} />
          </button>
          <button className="p-2 rounded-lg hover:bg-[#3c4249] text-[#54656f] hover:text-white transition-colors">
            <LuBookDown size={20} />
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

        {/*   <div className="flex justify-between items-center px-4 py-3 bg-[#f0f2f5]">
          <div className="flex items-center">
            <div
              className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden cursor-pointer"
              onClick={() => signOut()}
            >
              {user?.user_metadata.avatar_url ? (
                <Image
                  src={user.user_metadata.avatar_url || "/placeholder.svg"}
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
        </div> */}

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
