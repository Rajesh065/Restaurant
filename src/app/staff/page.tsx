"use client";

import { Suspense, useState } from "react";
import {
  loadStore,
  updateReservationStatus,
  updateTableStatus,
  addReservation,
  generateRefCode,
} from "@/lib/store";
import type {
  DineEaseStore,
  Reservation,
  ReservationStatus,
  TableStatus,
} from "@/types/dineease";
import { STATUS_TRANSITIONS, TIME_SLOTS } from "@/types/dineease";
import RoleGuard from "@/components/RoleGuard";

const TABLE_STATUS_OPTIONS: TableStatus[] = ["Available", "Reserved", "Occupied", "Cleaning", "Unavailable"];

const STATUS_COLORS: Record<ReservationStatus, string> = {
  Confirmed: "bg-blue-100 text-blue-700",
  "Checked In": "bg-indigo-100 text-indigo-700",
  Seated: "bg-purple-100 text-purple-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-gray-100 text-gray-500",
  "No Show": "bg-red-100 text-red-700",
};

const TABLE_STATUS_COLORS: Record<TableStatus, string> = {
  Available: "bg-green-100 text-green-700",
  Reserved: "bg-blue-100 text-blue-700",
  Occupied: "bg-orange-100 text-orange-700",
  Cleaning: "bg-yellow-100 text-yellow-700",
  Unavailable: "bg-gray-100 text-gray-500",
};

function today() {
  return new Date().toISOString().split("T")[0];
}

// Staff demo: manages restaurant "r1"
const STAFF_RESTAURANT_ID = "r1";

function StaffContent() {
  const [store, setStore] = useState<DineEaseStore>(() => loadStore());
  const [activeTab, setActiveTab] = useState<"reservations" | "tables" | "walkin">("reservations");
  const [dateFilter, setDateFilter] = useState(today());
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "All">("All");
  const [statusError, setStatusError] = useState<string | null>(null);

  // Walk-in form
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInEmail] = useState("walkin@dineease.local");
  const [walkInParty, setWalkInParty] = useState(2);
  const [walkInTable, setWalkInTable] = useState("");
  const [walkInTime, setWalkInTime] = useState(TIME_SLOTS[0]);
  const [walkInSaved, setWalkInSaved] = useState<string | null>(null);

  const restaurant = store.restaurants.find((r) => r.id === STAFF_RESTAURANT_ID);
  const allReservations = store.reservations.filter((r) => r.restaurantId === STAFF_RESTAURANT_ID);

  const filteredReservations = allReservations.filter((r) => {
    if (dateFilter && r.date !== dateFilter) return false;
    if (statusFilter !== "All" && r.status !== statusFilter) return false;
    return true;
  });

  const sortedReservations = [...filteredReservations].sort((a, b) =>
    a.timeSlot.localeCompare(b.timeSlot)
  );

  const tables = store.tables.filter((t) => t.restaurantId === STAFF_RESTAURANT_ID);

  function handleStatusChange(res: Reservation, newStatus: ReservationStatus) {
    setStatusError(null);
    const { store: newStore, error } = updateReservationStatus(store!, res.id, newStatus);
    if (error) {
      setStatusError(error);
      setTimeout(() => setStatusError(null), 3000);
    } else {
      setStore(newStore);
    }
  }

  function handleTableStatusChange(tableId: string, status: TableStatus) {
    const newStore = updateTableStatus(store!, tableId, status);
    setStore(newStore);
  }

  function handleWalkIn(e: React.FormEvent) {
    e.preventDefault();
    if (!walkInName.trim() || !walkInTable) return;
    const ref = generateRefCode();
    const reservation: Reservation = {
      id: ref,
      restaurantId: STAFF_RESTAURANT_ID,
      tableId: walkInTable,
      guestName: walkInName.trim(),
      guestEmail: walkInEmail,
      guestPhone: walkInPhone.trim() || "N/A",
      partySize: walkInParty,
      date: today(),
      timeSlot: walkInTime,
      specialRequests: "Walk-in guest",
      status: "Seated",
      depositAmount: 0,
      createdAt: new Date().toISOString(),
      isWalkIn: true,
    };
    const newStore = addReservation(store!, reservation);
    setStore(newStore);
    setWalkInSaved(ref);
    setWalkInName("");
    setWalkInPhone("");
    setWalkInTable("");
    setTimeout(() => setWalkInSaved(null), 4000);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Staff Panel</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {restaurant?.name} — Daily operations
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Today's Reservations",
            value: allReservations.filter((r) => r.date === today()).length,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Seated Now",
            value: allReservations.filter((r) => r.status === "Seated").length,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Available Tables",
            value: tables.filter((t) => t.status === "Available").length,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Total Tables",
            value: tables.length,
            color: "text-gray-600",
            bg: "bg-gray-50",
          },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-4 border border-gray-100`}>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit flex-wrap">
        {(["reservations", "tables", "walkin"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab ? "bg-white text-orange-600 shadow-sm" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {tab === "reservations" ? "📅 Reservations" : tab === "tables" ? "🪑 Live Tables" : "🚶 Walk-In"}
          </button>
        ))}
      </div>

      {statusError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">
          ⚠️ {statusError}
        </div>
      )}

      {/* ── Reservations Tab ── */}
      {activeTab === "reservations" && (
        <div>
          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 shadow-sm">
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ReservationStatus | "All")}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option>All</option>
                {(["Confirmed", "Checked In", "Seated", "Completed", "Cancelled", "No Show"] as ReservationStatus[]).map(
                  (s) => <option key={s}>{s}</option>
                )}
              </select>
            </div>
            <div className="flex items-end">
              <span className="text-sm text-gray-500">
                {sortedReservations.length} reservation{sortedReservations.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Reservation Cards */}
          {sortedReservations.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📅</p>
              <p>No reservations match your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedReservations.map((res) => {
                const table = store.tables.find((t) => t.id === res.tableId);
                const nextStatuses = STATUS_TRANSITIONS[res.status];
                return (
                  <div key={res.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-orange-600">{res.id}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[res.status]}`}>
                            {res.status}
                          </span>
                          {res.isWalkIn && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Walk-In</span>
                          )}
                        </div>
                        <p className="font-semibold text-gray-800">{res.guestName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          ⏰ {res.timeSlot} · 👥 {res.partySize} guests · 🪑 {table?.label || "?"} ({table?.section})
                        </p>
                        {res.specialRequests && (
                          <p className="text-xs text-gray-400 mt-0.5 italic">📝 {res.specialRequests}</p>
                        )}
                      </div>
                      {/* Status actions */}
                      <div className="flex flex-wrap gap-1.5">
                        {nextStatuses.map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(res, s)}
                            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${STATUS_COLORS[s]} hover:opacity-80 border-transparent`}
                          >
                            → {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Live Tables Tab ── */}
      {activeTab === "tables" && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Click a status badge to update the live table status.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.map((table) => (
              <div key={table.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-800 text-lg">{table.label}</p>
                    <p className="text-xs text-gray-500">{table.section} · Up to {table.capacity} guests</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${TABLE_STATUS_COLORS[table.status]}`}>
                    {table.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {TABLE_STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleTableStatusChange(table.id, s)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all font-medium ${
                        table.status === s
                          ? `${TABLE_STATUS_COLORS[s]} border-transparent`
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Walk-In Tab ── */}
      {activeTab === "walkin" && (
        <div className="max-w-lg">
          {walkInSaved && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-green-700 font-medium text-sm">✅ Walk-in logged!</p>
              <p className="text-green-600 text-xs mt-1">Booking reference: <span className="font-mono font-bold">{walkInSaved}</span></p>
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Log Walk-In Guest</h3>
            <form onSubmit={handleWalkIn} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-medium">Guest Name *</label>
                <input type="text" value={walkInName} onChange={(e) => setWalkInName(e.target.value)} required
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-medium">Phone</label>
                  <input type="text" value={walkInPhone} onChange={(e) => setWalkInPhone(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-medium">Party Size</label>
                  <input type="number" min={1} max={20} value={walkInParty}
                    onChange={(e) => setWalkInParty(Number(e.target.value))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-medium">Time Slot</label>
                  <select value={walkInTime} onChange={(e) => setWalkInTime(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    {TIME_SLOTS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 font-medium">Table *</label>
                  <select value={walkInTable} onChange={(e) => setWalkInTable(e.target.value)} required
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    <option value="">Select table</option>
                    {tables.filter((t) => t.status === "Available" || t.status === "Cleaning").map((t) => (
                      <option key={t.id} value={t.id}>{t.label} ({t.section}, {t.capacity} guests)</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit"
                className="w-full bg-orange-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-700 transition-colors mt-2">
                Log Walk-In (Seat Directly)
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffPage() {
  return (
    <RoleGuard allowedRoles={["staff"]} pageTitle="Staff Panel">
      <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading staff panel…</div>}>
        <StaffContent />
      </Suspense>
    </RoleGuard>
  );
}
