"use client";
import "./globals.css";
import type { AppProps } from "next/app";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatWindow } from "@/components/Chatwindow";

export default function App({ Component, pageProps }: AppProps) {
const { user, loading } = useAuth();
const router = useRouter();

useEffect(() => {
if (!loading && !user) {
router.push("/login");
}
}, [user, loading, router]);

if (loading) {
return (
<div className="flex items-center justify-center h-screen">
<p>Loading...</p>
</div>
);
}

if (!user) {
return null; // Will redirect in useEffect
}
return (
<div className="flex h-screen overflow-hidden">
<div className="w-1/3 h-full">
<Sidebar />
</div>
<div className="w-2/3 h-full">
<ChatWindow />
</div>
</div>
);
}
