"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const supabase = createClient();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      router.push("/"); // Redirect to home after login
      router.refresh();
    }
  };

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Check your email for the confirmation link!");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
      <form onSubmit={handleLogin} className="p-8 bg-white dark:bg-zinc-900 shadow-xl rounded-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-800">
        <h1 className="text-2xl font-bold mb-6">Welcome Back</h1>
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 rounded-lg border dark:bg-zinc-800 dark:border-zinc-700"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-6 rounded-lg border dark:bg-zinc-800 dark:border-zinc-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex gap-4">
          <button type="submit" className="flex-1 bg-black dark:bg-white dark:text-black text-white p-3 rounded-lg font-medium">
            Log In
          </button>
          <button type="button" onClick={handleSignUp} className="flex-1 border border-zinc-300 dark:border-zinc-700 p-3 rounded-lg font-medium">
            Sign Up
          </button>
        </div>
      </form>
    </div>
  );
}