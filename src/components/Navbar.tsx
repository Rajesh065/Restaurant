"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import type { Role } from "@/types/dineease";
import { ROLE_HOME, ROLE_LABELS } from "@/types/dineease";
import { resetStore } from "@/lib/store";
import {
  getServerSessionSnapshot,
  getSessionSnapshot,
  logoutUser,
  resetAuth,
  subscribeAuth,
} from "@/lib/auth";

const ROLE_EMOJI: Record<Role, string> = {
  customer: "👤",
  owner: "🏪",
  staff: "👨‍🍳",
  admin: "🛡️",
};

const NAV_LINKS: Record<Role, { href: string; label: string }[]> = {
  customer: [
    { href: "/", label: "Browse" },
    { href: "/bookings", label: "My Bookings" },
  ],
  owner: [{ href: "/owner", label: "My Restaurant" }],
  staff: [{ href: "/staff", label: "Staff Panel" }],
  admin: [{ href: "/admin", label: "Admin Panel" }],
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useSyncExternalStore(
    subscribeAuth,
    getSessionSnapshot,
    getServerSessionSnapshot
  );
  const [menuOpen, setMenuOpen] = useState(false);

  const links = user ? NAV_LINKS[user.role] : [{ href: "/", label: "Browse" }];
  const homeHref = user ? ROLE_HOME[user.role] : "/";

  function handleLogout() {
    logoutUser();
    setMenuOpen(false);
    router.push("/login");
  }

  function handleReset() {
    if (confirm("Reset all demo data and accounts to defaults? This cannot be undone.")) {
      resetStore();
      resetAuth();
      setMenuOpen(false);
      router.push("/login");
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={homeHref} className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <span className="font-bold text-xl text-orange-600">DineEase</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "text-orange-600 border-b-2 border-orange-600 pb-0.5"
                    : "text-gray-600 hover:text-orange-600"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side: Auth Account Menu / Sign In */}
          <div className="flex items-center gap-3">
            {!user ? (
              <Link
                href="/login"
                className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors"
              >
                Sign In
              </Link>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors"
                >
                  <span>{ROLE_EMOJI[user.role]}</span>
                  <span className="hidden sm:inline">{user.name}</span>
                  <span className="text-xs bg-white/80 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200">
                    {ROLE_LABELS[user.role]}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50">
                    <div className="px-3.5 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <p className="text-[11px] font-medium text-orange-600 mt-0.5">
                        {ROLE_LABELS[user.role]}
                      </p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span>🔄</span>
                      Reset Demo Data
                    </button>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                      >
                        <span>🚪</span>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t border-gray-100 pb-2 pt-1 flex gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium ${
                pathname === link.href ? "text-orange-600" : "text-gray-600"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Overlay to close account menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </nav>
  );
}
