"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  SEED_USERS,
  getServerSessionSnapshot,
  getSessionSnapshot,
  loginWithCredentials,
  registerUser,
  subscribeAuth,
} from "@/lib/auth";
import { ROLE_HOME, ROLE_LABELS } from "@/types/dineease";

export default function LoginPage() {
  const router = useRouter();
  const currentUser = useSyncExternalStore(
    subscribeAuth,
    getSessionSnapshot,
    getServerSessionSnapshot
  );

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupRole, setSignupRole] = useState<"customer" | "owner">("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "signin") {
      if (!email.trim() || !password) {
        setError("Please enter both email and password.");
        return;
      }
      const res = loginWithCredentials(email, password);
      if (res.error || !res.user) {
        setError(res.error || "Sign in failed.");
        return;
      }
      router.push(ROLE_HOME[res.user.role]);
    } else {
      if (!name.trim() || !email.trim() || password.length < 6) {
        setError("Enter your name, email, and a password of at least 6 characters.");
        return;
      }
      const res = registerUser({ name, email, password, role: signupRole });
      if (res.error || !res.user) {
        setError(res.error || "Registration failed.");
        return;
      }
      router.push(ROLE_HOME[res.user.role]);
    }
  }

  function fillDemo(demoEmail: string, demoPassword: string) {
    setMode("signin");
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
  }

  if (currentUser) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-3">✅</div>
          <h1 className="text-xl font-bold text-gray-900">Already Signed In</h1>
          <p className="text-sm text-gray-600 mt-1 mb-5">
            Signed in as <span className="font-semibold">{currentUser.name}</span> ({ROLE_LABELS[currentUser.role]})
          </p>
          <Link
            href={ROLE_HOME[currentUser.role]}
            className="inline-block w-full bg-orange-600 text-white py-2.5 px-5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition-colors"
          >
            Continue to {ROLE_LABELS[currentUser.role]} Workspace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-6">
      <div className="w-full max-w-md space-y-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-7">
          <div className="text-center mb-6">
            <span className="text-4xl">🍽️</span>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              {mode === "signin" ? "Sign in to DineEase" : "Create your DineEase account"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {mode === "signin"
                ? "Access your personalized workspace based on your account role"
                : "Register as a Customer or Restaurant Owner"}
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-gray-100 rounded-lg p-1 mb-5">
            <button
              type="button"
              onClick={() => { setMode("signin"); setError(""); }}
              className={`py-2 rounded-md text-sm font-medium transition-all ${
                mode === "signin" ? "bg-white text-orange-600 shadow-sm" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(""); }}
              className={`py-2 rounded-md text-sm font-medium transition-all ${
                mode === "signup" ? "bg-white text-orange-600 shadow-sm" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="block text-xs text-gray-600 font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Priya Sharma"
                    required
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 font-medium mb-1">Account Type</label>
                  <select
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value as "customer" | "owner")}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  >
                    <option value="customer">Customer (Browse &amp; Book Tables)</option>
                    <option value="owner">Restaurant Owner (Manage Restaurant)</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs text-gray-600 font-medium mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@dineease.com"
                required
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 font-medium mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 pr-16 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700 font-medium"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-orange-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-700 transition-colors"
            >
              {mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>

        {/* Demo Credentials Helper */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Demo Credentials (Click to Autofill)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SEED_USERS.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => fillDemo(u.email, u.password)}
                className="text-left p-2.5 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-colors"
              >
                <p className="text-xs font-semibold text-gray-800">{ROLE_LABELS[u.role]}</p>
                <p className="text-xs text-gray-500 truncate">{u.email}</p>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">pw: {u.password}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
