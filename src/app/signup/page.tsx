"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { type FormEvent, useState } from "react";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await signUp(email, password, name);

    if (error) {
      setError(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f0f2f5]">
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-medium text-[#111b21] mb-6">
              Create an Account
            </h2>

            {error && (
              <div
                className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6"
                role="alert"
              >
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 text-gray-900">
              <div>
                <label
                  className="block text-[#54656f] text-sm font-medium mb-2"
                  htmlFor="name"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-md border border-[#d1d7db] focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent transition-colors"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label
                  className="block text-[#54656f] text-sm font-medium mb-2"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-md border border-[#d1d7db] focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent transition-colors"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label
                  className="block text-[#54656f] text-sm font-medium mb-2"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-md border border-[#d1d7db] focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent transition-colors"
                  placeholder="Create a password"
                />
              </div>

              <div>
                <label
                  className="block text-[#54656f] text-sm font-medium mb-2"
                  htmlFor="confirmPassword"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-md border border-[#d1d7db] focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent transition-colors"
                  placeholder="Confirm your password"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#00a884] hover:bg-[#008f72] text-white font-medium py-2.5 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00a884]"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Sign Up"}
              </button>
            </form>
          </div>

          <div className="px-6 py-4 bg-[#f0f2f5] border-t border-[#e9edef]">
            <p className="text-center text-[#54656f]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[#00a884] hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
