"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { Role } from "@/types/dineease";
import { ROLE_HOME, ROLE_LABELS } from "@/types/dineease";
import {
  getServerSessionSnapshot,
  getSessionSnapshot,
  subscribeAuth,
} from "@/lib/auth";

interface RoleGuardProps {
  allowedRoles: Role[];
  pageTitle: string;
  allowGuest?: boolean;
  children: React.ReactNode;
}

export default function RoleGuard({
  allowedRoles,
  pageTitle,
  allowGuest = false,
  children,
}: RoleGuardProps) {
  const user = useSyncExternalStore(
    subscribeAuth,
    getSessionSnapshot,
    getServerSessionSnapshot
  );

  // Guest access (not logged in)
  if (!user) {
    if (allowGuest) {
      return <>{children}</>;
    }
    const requiredLabels = allowedRoles.map((r) => ROLE_LABELS[r]).join(" or ");
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🔑</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-sm text-gray-600 mb-6">
            Please sign in with a <span className="font-semibold text-orange-600">{requiredLabels}</span> account to access{" "}
            <span className="font-semibold">{pageTitle}</span>.
          </p>
          <Link
            href="/login"
            className="inline-block w-full bg-orange-600 text-white py-2.5 px-5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition-colors"
          >
            Sign In to DineEase
          </Link>
        </div>
      </div>
    );
  }

  if (allowedRoles.includes(user.role)) {
    return <>{children}</>;
  }

  const requiredLabels = allowedRoles.map((r) => ROLE_LABELS[r]).join(" or ");

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-sm text-gray-600 mb-4">
          <span className="font-semibold">{pageTitle}</span> is only accessible to{" "}
          <span className="font-semibold text-orange-600">{requiredLabels}</span>.
        </p>
        <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-xs text-gray-500 mb-6">
          You are currently signed in as{" "}
          <span className="font-semibold text-gray-800">{user.name}</span> ({ROLE_LABELS[user.role]}).
        </div>
        <Link
          href={ROLE_HOME[user.role]}
          className="inline-block w-full bg-orange-600 text-white py-2.5 px-5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition-colors"
        >
          Go to {ROLE_LABELS[user.role]} Workspace
        </Link>
      </div>
    </div>
  );
}
