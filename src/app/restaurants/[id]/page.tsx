"use client";

import { Suspense, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  loadStore,
  addReservation,
  generateRefCode,
  getAvailableTables,
  isTableBooked,
} from "@/lib/store";
import {
  getServerSessionSnapshot,
  getSessionSnapshot,
  subscribeAuth,
} from "@/lib/auth";
import type { DineEaseStore, MenuItem, Table, Reservation } from "@/types/dineease";
import { TIME_SLOTS } from "@/types/dineease";
import RoleGuard from "@/components/RoleGuard";

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function RestaurantContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [store, setStore] = useState<DineEaseStore>(() => loadStore());
  const [activeTab, setActiveTab] = useState<"menu" | "book">("menu");
  const [menuFilter, setMenuFilter] = useState<"all" | "veg" | "nonveg">("all");

  const currentUser = useSyncExternalStore(
    subscribeAuth,
    getSessionSnapshot,
    getServerSessionSnapshot
  );

  // Booking form state
  const [date, setDate] = useState(today());
  const [timeSlot, setTimeSlot] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [selectedTable, setSelectedTable] = useState("");
  const [guestName, setGuestName] = useState(() => currentUser?.name || "");
  const [guestEmail, setGuestEmail] = useState(() => currentUser?.email || "");
  const [guestPhone, setGuestPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const restaurant = store.restaurants.find((r) => r.id === id);
  if (!restaurant) {
    return (
      <div className="text-center py-20">
        <p className="text-5xl mb-4">🍽️</p>
        <h2 className="text-xl font-bold text-gray-700">Restaurant not found</h2>
        <button onClick={() => router.push("/")} className="mt-4 text-orange-600 hover:underline text-sm">
          Back to browse
        </button>
      </div>
    );
  }

  const menuItems: MenuItem[] = store.menuItems.filter((m) => m.restaurantId === id && m.available);
  const categories = Array.from(new Set(menuItems.map((m) => m.category)));

  const filteredMenu = menuItems.filter((m) => {
    if (menuFilter === "veg") return m.isVeg;
    if (menuFilter === "nonveg") return !m.isVeg;
    return true;
  });

  const availableTables = date && timeSlot
    ? getAvailableTables(store, id, date, timeSlot, partySize)
    : [];

  function handleBook(e: React.FormEvent) {
    e.preventDefault();
    setBookingError("");
    if (!timeSlot) return setBookingError("Please select a time slot.");
    if (!selectedTable) return setBookingError("Please select a table.");
    if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim())
      return setBookingError("Please fill in all guest details.");

    // Double-check conflict at submit time
    if (isTableBooked(store!, selectedTable, date, timeSlot)) {
      return setBookingError("That table was just booked. Please choose another.");
    }

    const ref = generateRefCode();
    const reservation: Reservation = {
      id: ref,
      restaurantId: id,
      tableId: selectedTable,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      guestPhone: guestPhone.trim(),
      partySize,
      date,
      timeSlot,
      specialRequests: specialRequests.trim(),
      status: "Confirmed",
      depositAmount: restaurant!.priceTier === "$$$$" ? 2000 : restaurant!.priceTier === "$$$" ? 1000 : 500,
      createdAt: new Date().toISOString(),
      isWalkIn: false,
    };

    setSubmitting(true);
    setTimeout(() => {
      const updated = addReservation(store!, reservation);
      setStore(updated);
      setBookingSuccess(ref);
      setSubmitting(false);
      // Reset form
      setTimeSlot("");
      setSelectedTable("");
      setGuestName("");
      setGuestEmail("");
      setGuestPhone("");
      setSpecialRequests("");
    }, 400);
  }

  const tableById = (tid: string) => store.tables.find((t) => t.id === tid);

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="h-48 sm:h-64 bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center text-8xl sm:text-9xl">
          {restaurant.coverImage}
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  restaurant.priceTier === "$" ? "bg-green-100 text-green-700" :
                  restaurant.priceTier === "$$" ? "bg-blue-100 text-blue-700" :
                  restaurant.priceTier === "$$$" ? "bg-purple-100 text-purple-700" :
                  "bg-orange-100 text-orange-700"
                }`}>
                  {restaurant.priceTier}
                </span>
              </div>
              <div className="text-sm text-gray-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>🍽️ {restaurant.cuisine} ({restaurant.country})</span>
                <span>📍 {restaurant.address}</span>
                <span>🕐 {restaurant.openingTime}–{restaurant.closingTime}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {restaurant.hasVegOptions && (
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">🌿 Veg Options</span>
                )}
                {restaurant.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full border border-gray-100">{tag}</span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-yellow-400 justify-end">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className={`w-4 h-4 ${i < Math.floor(restaurant.rating) ? "fill-current" : "fill-gray-200"}`} viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm font-semibold text-gray-800">{restaurant.rating}/5</p>
              <p className="text-xs text-gray-400">{restaurant.reviewCount} reviews</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600 leading-relaxed">{restaurant.description}</p>
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
            <a href={`tel:${restaurant.phone}`} className="hover:text-orange-600 transition-colors">
              📞 {restaurant.phone}
            </a>
            <a href={`mailto:${restaurant.email}`} className="hover:text-orange-600 transition-colors">
              ✉️ {restaurant.email}
            </a>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {(["menu", "book"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-white text-orange-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {tab === "menu" ? "🍜 Menu" : "📅 Reserve"}
          </button>
        ))}
      </div>

      {/* Menu Tab */}
      {activeTab === "menu" && (
        <div>
          {/* Filter */}
          <div className="flex gap-2 mb-5">
            {(["all", "veg", "nonveg"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setMenuFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  menuFilter === f
                    ? f === "veg" ? "bg-green-500 text-white border-green-500"
                      : f === "nonveg" ? "bg-red-500 text-white border-red-500"
                      : "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {f === "all" ? "All Items" : f === "veg" ? "🌿 Veg Only" : "🍖 Non-Veg"}
              </button>
            ))}
          </div>

          {categories.map((cat) => {
            const items = filteredMenu.filter((m) => m.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat} className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="w-6 h-px bg-gray-300 inline-block" />
                  {cat}
                  <span className="w-6 h-px bg-gray-300 inline-block" />
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
                      <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 mt-0.5 ${item.isVeg ? "border-green-500 bg-green-500" : "border-red-500 bg-red-500"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 flex-shrink-0">₹{item.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredMenu.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-8">No menu items match the filter.</p>
          )}
        </div>
      )}

      {/* Booking Tab */}
      {activeTab === "book" && (
        <div className="max-w-2xl">
          {!currentUser ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
              <div className="text-4xl mb-3">🔑</div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Sign in to reserve a table</h3>
              <p className="text-sm text-gray-500 mb-5">
                Please sign in with your Customer account to complete a reservation at {restaurant.name}.
              </p>
              <Link
                href="/login"
                className="inline-block bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition-colors"
              >
                Sign In to Book
              </Link>
            </div>
          ) : bookingSuccess ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="text-xl font-bold text-green-800 mb-1">Reservation Confirmed!</h3>
              <p className="text-green-700 text-sm mb-2">Your booking reference is:</p>
              <div className="bg-white border border-green-300 rounded-lg px-6 py-3 inline-block mb-4">
                <span className="text-2xl font-mono font-bold text-green-700">{bookingSuccess}</span>
              </div>
              <p className="text-xs text-green-600 mb-4">Save this code — you&apos;ll need it to manage your reservation.</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button
                  onClick={() => setBookingSuccess(null)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  Make Another Reservation
                </button>
                <a
                  href="/bookings"
                  className="px-4 py-2 bg-white text-green-700 border border-green-300 rounded-lg text-sm font-medium hover:bg-green-50"
                >
                  View My Bookings
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleBook} className="space-y-5">
              {/* Date & Time */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-800 mb-4">Select Date &amp; Time</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 font-medium">Date</label>
                    <input
                      type="date"
                      value={date}
                      min={today()}
                      onChange={(e) => { setDate(e.target.value); setSelectedTable(""); }}
                      required
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 font-medium">Party Size</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={partySize}
                      onChange={(e) => { setPartySize(Number(e.target.value)); setSelectedTable(""); }}
                      required
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-xs text-gray-500 mb-2 font-medium">Time Slot</label>
                  <div className="flex flex-wrap gap-2">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => { setTimeSlot(slot); setSelectedTable(""); }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                          timeSlot === slot
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-white text-gray-700 border-gray-200 hover:border-orange-300"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table Selection */}
              {date && timeSlot && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-800 mb-1">Available Tables</h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Showing tables for {partySize} guest{partySize > 1 ? "s" : ""} on {date} at {timeSlot}
                  </p>
                  {availableTables.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
                      No tables available for the selected criteria. Try a different time slot or date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {availableTables.map((table: Table) => (
                        <button
                          key={table.id}
                          type="button"
                          onClick={() => setSelectedTable(table.id)}
                          className={`text-left p-3 rounded-lg border-2 transition-all ${
                            selectedTable === table.id
                              ? "border-orange-500 bg-orange-50"
                              : "border-gray-200 bg-white hover:border-orange-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-gray-800">{table.label}</span>
                            {selectedTable === table.id && (
                              <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {table.section} · Up to {table.capacity} guests
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Guest Details */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-800 mb-4">Guest Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 font-medium">Full Name</label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="John Smith"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-medium">Email</label>
                      <input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-medium">Phone</label>
                      <input
                        type="tel"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 font-medium">Special Requests (optional)</label>
                    <textarea
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Allergies, occasion, seating preference…"
                      rows={2}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Deposit info */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
                💳 A refundable deposit of <strong>₹{restaurant.priceTier === "$$$$" ? 2000 : restaurant.priceTier === "$$$" ? 1000 : 500}</strong> is required to confirm your reservation.
              </div>

              {bookingError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  ⚠️ {bookingError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || !selectedTable}
                className="w-full bg-orange-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Confirming…" : "Confirm Reservation"}
              </button>

              {/* Show selected table summary */}
              {selectedTable && tableById(selectedTable) && (
                <div className="text-xs text-gray-500 text-center">
                  Reserving {tableById(selectedTable)!.label} ({tableById(selectedTable)!.section}, max {tableById(selectedTable)!.capacity} guests)
                  for {partySize} on {date} at {timeSlot}
                </div>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function RestaurantPage() {
  return (
    <RoleGuard allowedRoles={["customer"]} pageTitle="Restaurant Details & Booking" allowGuest>
      <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading restaurant…</div>}>
        <RestaurantContent />
      </Suspense>
    </RoleGuard>
  );
}
