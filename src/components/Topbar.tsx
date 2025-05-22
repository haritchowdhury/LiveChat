"use client";

import type React from "react";
import {
  MdMenu,
  MdSearch,
  MdNotifications,
  MdSettings,
  MdAccountCircle,
  MdMoreVert,
} from "react-icons/md";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FiSearch, FiSettings, FiRefreshCw } from "react-icons/fi";
import { IoChatbubbleEllipsesSharp } from "react-icons/io5";
import { IoIosHelpCircleOutline } from "react-icons/io";
import { FaStar } from "react-icons/fa";
import { IoMdCode } from "react-icons/io";
import { MdOutlineResetTv } from "react-icons/md";
import { RiNotificationOffFill } from "react-icons/ri";
import { WiStars } from "react-icons/wi";
import { LuLogs } from "react-icons/lu";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
export const Topbar: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="h-8 bg-white flex items-center justify-between px-2 text-white shadow-sm border-b border-[#d1d7db] z-10">
      {/* Left side - Menu button */}
      <div className="flex items-center gap-4">
        <Image src="/logo.jpg" alt="Logo" height={20} width={20} />

        <button className="flex items-center space-x-2 text-[#54656f] hover:text-[#00a884] text-xs">
          <IoChatbubbleEllipsesSharp size={18} />
          <span>Chats</span>
        </button>
      </div>

      {/* Right side - Multiple buttons */}
      <div className="flex items-center space-x-2">
        <button className="flex items-center space-x-2 text-[#54656f] hover:text-[#00a884] text-xs  border border-gray-200 px-1  rounded-md">
          <FiRefreshCw size={14} />
          <span className="text-sm">Refresh</span>
        </button>
        <button className="flex items-center space-x-2 text-[#54656f] hover:text-[#00a884] text-xs  border border-gray-200 px-1  rounded-md">
          <IoIosHelpCircleOutline size={14} />
          <span className="text-sm">Help</span>
        </button>
        <button className="flex items-center space-x-2 text-[#54656f] hover:text-[#00a884] text-xs  border border-gray-200 px-1  rounded-md">
          <FaStar className="text-yellow-500" size={14} />
          <span className="text-sm">5/5 phones</span>
          <IoMdCode size={14} />
        </button>
        <button className="p-2 rounded-full hover:bg-[#008f72] text-[#54656f] hover:text-white text-xs border border-gray-200 px-1 py-1 rounded-md">
          <MdOutlineResetTv size={14} />
        </button>
        <button className="p-2 rounded-full hover:bg-[#008f72] text-[#54656f] hover:text-white  text-xs border border-gray-200 px-1 py-1 rounded-md">
          <RiNotificationOffFill size={14} />
        </button>
        <button
          className="rounded-full hover:bg-[#008f72] text-[#54656f] hover:text-white  text-xs border border-gray-200 px-1 py-1 rounded-md"
          onClick={() => signOut()}
        >
          <span>Sign Out</span>
        </button>
        <button className="flex items-center space-x-2 text-[#54656f] hover:text-[#00a884] text-xs border border-gray-200 px-1 py-1 rounded-md">
          <WiStars className="text-yellow-500" size={14} />
          <LuLogs size={14} />
        </button>
      </div>
    </div>
  );
};
