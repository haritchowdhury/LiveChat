// @/lib/supabaseClient.js
"use client";

import { createClient } from "@supabase/supabase-js";

// Make sure environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Add safeguards for missing environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables");
}

// Create the Supabase client
export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  // Disable realtime by default to avoid WebSocket errors
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
