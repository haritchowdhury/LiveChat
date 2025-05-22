"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatWindow } from "@/components/Chatwindow";
import { Topbar } from "@/components/Topbar";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f0f2f5]">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 mb-4 bg-[#00a884] rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex flex-col h-screen  bg-[#f0f2f5]">
      {/* Topbar */}
      <div className="flex-shrink-0">
        <Topbar />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 min-w-80 max-w-80 h-full border-r border-[#d1d7db] flex-shrink-0">
          <Sidebar />
        </div>
        <div className="flex-1 h-full min-w-0">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
}
