"use client";

import { useState } from "react";
import Link from "next/link";
import { loadStore, cancelReservation } from "@/lib/store";
import type { DineEaseStore, Reservation, ReservationStatus } from "@/types/dineease";
import RoleGuard from "@/components/RoleGuard";

const STATUS_COLORS: Record<ReservationStatus, string> = {
  Confirmed: "bg-blue-100 text-blue-700",
  "Checked In": "bg-indigo-100 text-indigo-700",
  Seated: "bg-purple-100 text-purple-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-gray-100 text-gray-500",
  "No Show": "bg-red-100 text-red-700",
};

const STATUS_ICONS: Record<ReservationStatus, string> = {
  Confirmed: "✅",
  "Checked In": "🚪",
  Seated: "🪑",
  Completed: "🎉",
  Cancelled: "❌",
  "No Show": "👻",
};

export default function BookingsPage() {
  const [store, setStore] = useState<DineEaseStore>(() => loadStore());
  const [emailFilter, setEmailFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Completed" | "Cancelled">("All");
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!store) return <div className="text-center py-20 text-gray-400">Loading…</div>;

  const getRestaurant = (id: string) => store.restaurants.find((r) => r.id === id);
  const getTable = (id: string) => store.tables.find((t) => t.id === id);

  const myReservations: Reservation[] = store.reservations.filter((r) => {
    if (statusFilter === "Active" && !["Confirmed", "Checked In", "Seated"].includes(r.status)) return false;
    if (statusFilter === "Completed" && r.status !== "Completed") return false;
    if (statusFilter === "Cancelled" && r.status !== "Cancelled" && r.status !== "No Show") return false;
    if (emailFilter && !r.guestEmail.toLowerCase().includes(emailFilter.toLowerCase())) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.guestName.toLowerCase().includes(q) ||
        getRestaurant(r.restaurantId)?.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sort: active first, then by date desc
  const sorted = [...myReservations].sort((a, b) => {
    const aActive = ["Confirmed", "Checked In", "Seated"].includes(a.status);
    const bActive = ["Confirmed", "Checked In", "Seated"].includes(b.status);
    if (aActive !== bActive) return aActive ? -1 : 1;
    return b.date.localeCompare(a.date);
  });

  function handleCancel(id: string) {
    const updated = cancelReservation(store!, id);
    setStore(updated);
    setConfirmCancel(null);
  }

  function handleCopyRef(id: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(id).catch(() => {});
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500);
  }

  const canCancel = (r: Reservation) =>
    ["Confirmed", "Checked In"].includes(r.status);

  return (
    <RoleGuard allowedRoles={["customer"]} pageTitle="My Bookings">
      <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Reservations</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage your restaurant bookings</p>
      </div>

      {/* Search / Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by reference code, name, or restaurant…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <input
            type="email"
            placeholder="Filter by email address…"
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["All", "Active", "Completed", "Cancelled"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === tab
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📅</p>
          <h2 className="text-lg font-semibold text-gray-700">No reservations found</h2>
          <p className="text-sm text-gray-400 mt-1">
            {emailFilter || searchQuery
              ? "Try a different search query"
              : "Browse restaurants and make your first reservation"}
          </p>
          <Link
            href="/"
            className="mt-4 inline-block px-5 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
          >
            Browse Restaurants
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((res) => {
            const rest = getRestaurant(res.restaurantId);
            const table = getTable(res.tableId);
            return (
              <div
                key={res.id}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                  res.status === "Cancelled" || res.status === "No Show"
                    ? "border-gray-200 opacity-70"
                    : "border-gray-200"
                }`}
              >
                <div className="p-5">
                  <div className="flex flex-wrap items-start gap-4">
                    {/* Left */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-bold text-orange-600">{res.id}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyRef(res.id)}
                          className="text-[11px] px-2 py-0.5 rounded border border-gray-200 text-gray-500 hover:text-orange-600 hover:border-orange-300 transition-colors"
                          title="Copy reference code"
                        >
                          {copiedId === res.id ? "Copied!" : "Copy"}
                        </button>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[res.status]}`}>
                          {STATUS_ICONS[res.status]} {res.status}
                        </span>
                        {res.isWalkIn && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Walk-In</span>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {rest ? (
                          <Link href={`/restaurants/${rest.id}`} className="hover:text-orange-600 hover:underline">
                            {rest.name}
                          </Link>
                        ) : "Unknown Restaurant"}
                      </h3>
                      <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span>👤 {res.guestName}</span>
                        <span>👥 {res.partySize} guest{res.partySize > 1 ? "s" : ""}</span>
                        <span>📅 {res.date} at {res.timeSlot}</span>
                        {table && <span>🪑 {table.label} ({table.section})</span>}
                      </div>
                      {res.specialRequests && (
                        <p className="text-xs text-gray-400 mt-1 italic">📝 &ldquo;{res.specialRequests}&rdquo;</p>
                      )}
                    </div>

                    {/* Right */}
                    <div className="text-right flex flex-col items-end gap-2">
                      <p className="text-sm font-semibold text-gray-800">₹{res.depositAmount} deposit</p>
                      <p className="text-xs text-gray-400">{new Date(res.createdAt).toLocaleDateString()}</p>
                      {canCancel(res) && (
                        <button
                          onClick={() => setConfirmCancel(res.id)}
                          className="text-xs text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 px-2 py-1 rounded-lg transition-colors"
                        >
                          Cancel Reservation
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cancel confirmation inline */}
                {confirmCancel === res.id && (
                  <div className="border-t border-red-100 bg-red-50 px-5 py-3 flex items-center justify-between gap-4">
                    <p className="text-sm text-red-700">Are you sure you want to cancel this reservation?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmCancel(null)}
                        className="text-sm px-3 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      >
                        Keep It
                      </button>
                      <button
                        onClick={() => handleCancel(res.id)}
                        className="text-sm px-3 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700"
                      >
                        Yes, Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {sorted.length > 0 && (
        <div className="mt-6 text-xs text-gray-400 text-right">
          Showing {sorted.length} reservation{sorted.length !== 1 ? "s" : ""}
        </div>
      )}
      </div>
    </RoleGuard>
  );
}
