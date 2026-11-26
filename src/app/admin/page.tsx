"use client";

import { useState } from "react";
import { loadStore, updateRestaurant, resetStore, getMetrics } from "@/lib/store";
import type { DineEaseStore, Restaurant, RestaurantStatus } from "@/types/dineease";
import RoleGuard from "@/components/RoleGuard";

const STATUS_COLORS: Record<RestaurantStatus, string> = {
  approved: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  suspended: "bg-red-100 text-red-700",
};

export default function AdminPage() {
  const [store, setStore] = useState<DineEaseStore>(() => loadStore());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RestaurantStatus | "all">("all");
  const [resetConfirm, setResetConfirm] = useState(false);

  const metrics = getMetrics(store);

  const filteredRestaurants = store.restaurants.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.city.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function toggleApproval(restaurant: Restaurant) {
    const newStatus: RestaurantStatus =
      restaurant.status === "approved" ? "suspended" :
      restaurant.status === "pending" ? "approved" : "approved";
    const updated: Restaurant = { ...restaurant, status: newStatus };
    const newStore = updateRestaurant(store!, updated);
    setStore(newStore);
  }

  function handleReset() {
    if (resetConfirm) {
      const fresh = resetStore();
      setStore(fresh);
      setResetConfirm(false);
    } else {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 5000);
    }
  }

  return (
    <RoleGuard allowedRoles={["admin"]} pageTitle="Super Admin Panel">
      <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Super Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-0.5">Marketplace management and oversight</p>
        </div>
        <button
          onClick={handleReset}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            resetConfirm
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          🔄 {resetConfirm ? "Click again to confirm reset" : "Reset Demo Data"}
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {[
          { label: "Total Restaurants", value: metrics.totalRestaurants, color: "text-gray-700", bg: "bg-white", icon: "🏪" },
          { label: "Approved", value: metrics.approvedRestaurants, color: "text-green-700", bg: "bg-green-50", icon: "✅" },
          { label: "Pending Review", value: metrics.pendingRestaurants, color: "text-yellow-700", bg: "bg-yellow-50", icon: "⏳" },
          { label: "Total Bookings", value: metrics.totalBookings, color: "text-blue-700", bg: "bg-blue-50", icon: "📅" },
          { label: "Active Bookings", value: metrics.activeBookings, color: "text-purple-700", bg: "bg-purple-50", icon: "🔥" },
          {
            label: "Deposits Collected",
            value: `₹${metrics.depositsCollected.toLocaleString()}`,
            color: "text-orange-700",
            bg: "bg-orange-50",
            icon: "💰",
          },
        ].map((m) => (
          <div key={m.label} className={`${m.bg} rounded-xl border border-gray-200 p-4 shadow-sm`}>
            <p className="text-xl mb-1">{m.icon}</p>
            <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Booking breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">Booking Status Breakdown</h3>
        <div className="flex flex-wrap gap-3">
          {(["Confirmed", "Checked In", "Seated", "Completed", "Cancelled", "No Show"] as const).map((status) => {
            const count = store.reservations.filter((r) => r.status === status).length;
            return (
              <div key={status} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-sm font-semibold text-gray-800">{count}</span>
                <span className="text-xs text-gray-500">{status}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Restaurant Management */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-gray-800">Restaurant Registry</h3>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Search restaurants…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RestaurantStatus | "all")}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredRestaurants.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">No restaurants match your filter.</p>
          )}
          {filteredRestaurants.map((r) => {
            const bookingCount = store.reservations.filter((res) => res.restaurantId === r.id).length;
            const activeBookings = store.reservations.filter(
              (res) => res.restaurantId === r.id && ["Confirmed", "Checked In", "Seated"].includes(res.status)
            ).length;
            const deposits = store.reservations
              .filter((res) => res.restaurantId === r.id && res.status !== "Cancelled")
              .reduce((sum, res) => sum + res.depositAmount, 0);

            return (
              <div key={r.id} className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="text-3xl">{r.coverImage}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-800">{r.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[r.status]}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {r.cuisine} · {r.city} · {r.priceTier}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    📅 {bookingCount} total bookings · 🔥 {activeBookings} active · 💰 ₹{deposits.toLocaleString()} deposits
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-gray-400">Rating: ⭐ {r.rating}</span>
                  <button
                    onClick={() => toggleApproval(r)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                      r.status === "approved"
                        ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    }`}
                  >
                    {r.status === "approved" ? "Suspend" : "Approve"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Reservations */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Recent Reservations (All Restaurants)</h3>
        <div className="space-y-2">
          {[...store.reservations]
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, 10)
            .map((res) => {
              const rest = store.restaurants.find((r) => r.id === res.restaurantId);
              return (
                <div key={res.id} className="flex flex-wrap items-center gap-3 text-sm py-2 border-b border-gray-100 last:border-0">
                  <span className="font-mono text-xs text-orange-600 font-bold w-32">{res.id}</span>
                  <span className="text-gray-700 flex-1">{res.guestName}</span>
                  <span className="text-gray-500 text-xs">{rest?.name}</span>
                  <span className="text-gray-400 text-xs">{res.date}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    res.status === "Confirmed" ? "bg-blue-100 text-blue-700" :
                    res.status === "Completed" ? "bg-green-100 text-green-700" :
                    res.status === "Cancelled" ? "bg-gray-100 text-gray-500" :
                    "bg-orange-100 text-orange-700"
                  }`}>{res.status}</span>
                  <span className="text-xs text-gray-500">₹{res.depositAmount}</span>
                </div>
              );
            })}
        </div>
      </div>
      </div>
    </RoleGuard>
  );
}
