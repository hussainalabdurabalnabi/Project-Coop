"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "signup") {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-10 flex flex-col items-center gap-4 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          {mode === "login" ? "Sign in" : "Create an account"}
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
            required
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition"
          >
            {mode === "login" ? "Sign in" : "Sign up"}
          </button>
        </form>
        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="text-sm text-indigo-600 hover:underline"
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}