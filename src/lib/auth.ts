"use client";

import type { AuthUser, Role } from "@/types/dineease";

const USERS_KEY = "dineease_users";
const SESSION_KEY = "dineease_session_user";

export const SEED_USERS: AuthUser[] = [
  {
    id: "u-customer",
    name: "Priya Sharma",
    email: "customer@dineease.com",
    password: "password123",
    role: "customer",
  },
  {
    id: "u-owner",
    name: "Arjun Kapoor",
    email: "owner@dineease.com",
    password: "password123",
    role: "owner",
    ownerId: "owner1",
  },
  {
    id: "u-staff",
    name: "Rohan Verma",
    email: "staff@dineease.com",
    password: "password123",
    role: "staff",
    restaurantId: "r1",
  },
  {
    id: "u-admin",
    name: "Admin Portal",
    email: "admin@dineease.com",
    password: "password123",
    role: "admin",
  },
];

let cachedRawSession: string | null | undefined;
let cachedParsedSession: AuthUser | null = null;

function notifyAuthChange() {
  window.dispatchEvent(new Event("dineease_auth_change"));
}

export function loadUsers(): AuthUser[] {
  if (typeof window === "undefined") return SEED_USERS;
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
      return SEED_USERS;
    }
    return JSON.parse(raw) as AuthUser[];
  } catch {
    return SEED_USERS;
  }
}

export function subscribeAuth(callback: () => void) {
  window.addEventListener("dineease_auth_change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("dineease_auth_change", callback);
    window.removeEventListener("storage", callback);
  };
}

export function getSessionSnapshot(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw === cachedRawSession) {
    return cachedParsedSession;
  }
  cachedRawSession = raw;
  if (!raw) {
    cachedParsedSession = null;
    return null;
  }
  try {
    cachedParsedSession = JSON.parse(raw) as AuthUser;
  } catch {
    cachedParsedSession = null;
  }
  return cachedParsedSession;
}

export function getServerSessionSnapshot(): AuthUser | null {
  return null;
}

export function loginWithCredentials(
  email: string,
  password: string
): { user?: AuthUser; error?: string } {
  const users = loadUsers();
  const normalized = email.trim().toLowerCase();
  const found = users.find((u) => u.email.toLowerCase() === normalized);
  if (!found || found.password !== password) {
    return { error: "Invalid email or password." };
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(found));
  localStorage.setItem("dineease_role", found.role);
  notifyAuthChange();
  return { user: found };
}

export function registerUser(params: {
  name: string;
  email: string;
  password: string;
  role: Extract<Role, "customer" | "owner">;
}): { user?: AuthUser; error?: string } {
  const users = loadUsers();
  const normalized = params.email.trim().toLowerCase();
  if (users.some((u) => u.email.toLowerCase() === normalized)) {
    return { error: "An account with this email already exists." };
  }
  const newUser: AuthUser = {
    id: `u-${Date.now()}`,
    name: params.name.trim(),
    email: normalized,
    password: params.password,
    role: params.role,
    ownerId: params.role === "owner" ? "owner1" : undefined,
  };
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
  localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
  localStorage.setItem("dineease_role", newUser.role);
  notifyAuthChange();
  return { user: newUser };
}

export function logoutUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("dineease_role");
  notifyAuthChange();
}

export function resetAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("dineease_role");
  notifyAuthChange();
}
