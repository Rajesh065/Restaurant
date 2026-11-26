"use client";

import { useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import {
  loadStore,
  updateRestaurant,
  addMenuItem,
  updateMenuItem,
  addTable,
  updateTable,
} from "@/lib/store";
import type {
  DineEaseStore,
  Restaurant,
  MenuItem,
  Table,
  Reservation,
  SeatingSection,
  CuisineType,
  PriceTier,
  ReservationStatus,
} from "@/types/dineease";

const SECTIONS: SeatingSection[] = ["Indoor", "Outdoor", "Rooftop", "Bar", "Private"];
const CUISINES: CuisineType[] = ["Indian", "Italian", "Chinese", "Mexican", "Japanese", "American", "Mediterranean", "Thai", "French", "Fusion"];
const PRICE_TIERS: PriceTier[] = ["$", "$$", "$$$", "$$$$"];

const STATUS_COLORS: Record<ReservationStatus, string> = {
  Confirmed: "bg-blue-100 text-blue-700",
  "Checked In": "bg-indigo-100 text-indigo-700",
  Seated: "bg-purple-100 text-purple-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-gray-100 text-gray-500",
  "No Show": "bg-red-100 text-red-700",
};

// Owner demo: manages restaurants with ownerId "owner1"
const OWNER_ID = "owner1";

export default function OwnerPage() {
  const [store, setStore] = useState<DineEaseStore>(() => loadStore());
  const [activeTab, setActiveTab] = useState<"details" | "menu" | "tables" | "reservations">("details");
  const [selectedRestId, setSelectedRestId] = useState<string>(() => {
    const ownerRests = loadStore().restaurants.filter((r) => r.ownerId === OWNER_ID);
    return ownerRests[0]?.id || "";
  });

  // Restaurant edit form
  const [editRest, setEditRest] = useState<Partial<Restaurant>>(() => {
    const ownerRests = loadStore().restaurants.filter((r) => r.ownerId === OWNER_ID);
    return ownerRests[0] || {};
  });
  const [restSaved, setRestSaved] = useState(false);

  // New menu item
  const [newItem, setNewItem] = useState({ name: "", description: "", price: 0, category: "", isVeg: true });
  const [itemSaved, setItemSaved] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");

  // New table
  const [newTable, setNewTable] = useState({ label: "", capacity: 2, section: "Indoor" as SeatingSection });
  const [tableSaved, setTableSaved] = useState(false);

  const ownerRestaurants = store.restaurants.filter((r) => r.ownerId === OWNER_ID);
  const restaurant = ownerRestaurants.find((r) => r.id === selectedRestId);

  if (ownerRestaurants.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-5xl mb-4">🏪</p>
        <h2 className="text-xl font-bold text-gray-700">No restaurants assigned</h2>
        <p className="text-sm text-gray-400 mt-1">Contact your admin to assign a restaurant to your account.</p>
      </div>
    );
  }

  const menuItems = store.menuItems.filter((m) => m.restaurantId === selectedRestId);
  const filteredMenuItems = menuItems.filter((m) => {
    if (!menuSearch.trim()) return true;
    const q = menuSearch.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q);
  });
  const tables = store.tables.filter((t) => t.restaurantId === selectedRestId);
  const reservations: Reservation[] = store.reservations.filter((r) => r.restaurantId === selectedRestId);

  function saveRestaurant() {
    if (!restaurant) return;
    const updated: Restaurant = { ...restaurant, ...editRest } as Restaurant;
    const newStore = updateRestaurant(store!, updated);
    setStore(newStore);
    setRestSaved(true);
    setTimeout(() => setRestSaved(false), 2000);
  }

  function saveNewMenuItem() {
    if (!newItem.name.trim() || newItem.price <= 0 || !newItem.category.trim()) return;
    const item: MenuItem = {
      id: `m${Date.now()}`,
      restaurantId: selectedRestId,
      name: newItem.name.trim(),
      description: newItem.description.trim(),
      price: newItem.price,
      category: newItem.category.trim(),
      isVeg: newItem.isVeg,
      available: true,
    };
    const newStore = addMenuItem(store!, item);
    setStore(newStore);
    setNewItem({ name: "", description: "", price: 0, category: "", isVeg: true });
    setItemSaved(true);
    setTimeout(() => setItemSaved(false), 2000);
  }

  function toggleItemAvailability(item: MenuItem) {
    const updated = { ...item, available: !item.available };
    setStore(updateMenuItem(store!, updated));
  }

  function saveNewTable() {
    if (!newTable.label.trim()) return;
    const table: Table = {
      id: `t${Date.now()}`,
      restaurantId: selectedRestId,
      label: newTable.label.trim(),
      capacity: newTable.capacity,
      section: newTable.section,
      status: "Available",
    };
    const newStore = addTable(store!, table);
    setStore(newStore);
    setNewTable({ label: "", capacity: 2, section: "Indoor" });
    setTableSaved(true);
    setTimeout(() => setTableSaved(false), 2000);
  }

  function updateTableCapacity(table: Table, capacity: number) {
    setStore(updateTable(store!, { ...table, capacity }));
  }

  return (
    <RoleGuard allowedRoles={["owner"]} pageTitle="Owner Panel">
      <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Owner Panel</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your restaurant(s)</p>
        </div>
        {/* Restaurant selector */}
        {ownerRestaurants.length > 1 && (
          <select
            value={selectedRestId}
            onChange={(e) => {
              setSelectedRestId(e.target.value);
              const r = store.restaurants.find((r) => r.id === e.target.value);
              if (r) setEditRest(r);
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            {ownerRestaurants.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Restaurant status banner */}
      {restaurant && (
        <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm font-medium ${
          restaurant.status === "approved" ? "bg-green-50 text-green-700 border border-green-200" :
          restaurant.status === "pending" ? "bg-yellow-50 text-yellow-700 border border-yellow-200" :
          "bg-red-50 text-red-700 border border-red-200"
        }`}>
          Status: <strong className="capitalize">{restaurant.status}</strong>
          {restaurant.status === "pending" && " — Awaiting admin approval"}
          {restaurant.status === "suspended" && " — Contact admin for details"}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit flex-wrap">
        {(["details", "menu", "tables", "reservations"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${
              activeTab === tab ? "bg-white text-orange-600 shadow-sm" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {tab === "details" ? "📋 Details" : tab === "menu" ? "🍜 Menu" : tab === "tables" ? "🪑 Tables" : "📅 Reservations"}
          </button>
        ))}
      </div>

      {/* ── Details Tab ── */}
      {activeTab === "details" && restaurant && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 max-w-2xl space-y-4">
          <h3 className="font-semibold text-gray-800">Restaurant Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Restaurant Name", key: "name" },
              { label: "City", key: "city" },
              { label: "Address", key: "address" },
              { label: "Phone", key: "phone" },
              { label: "Email", key: "email" },
            ].map(({ label, key }) => (
              <div key={key} className={key === "address" || key === "description" ? "sm:col-span-2" : ""}>
                <label className="block text-xs text-gray-500 mb-1 font-medium">{label}</label>
                <input
                  type="text"
                  value={(editRest as Record<string, unknown>)[key] as string || ""}
                  onChange={(e) => setEditRest({ ...editRest, [key]: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1 font-medium">Description</label>
              <textarea
                value={editRest.description || ""}
                onChange={(e) => setEditRest({ ...editRest, description: e.target.value })}
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">Cuisine</label>
              <select
                value={editRest.cuisine || ""}
                onChange={(e) => setEditRest({ ...editRest, cuisine: e.target.value as CuisineType })}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                {CUISINES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">Price Tier</label>
              <select
                value={editRest.priceTier || ""}
                onChange={(e) => setEditRest({ ...editRest, priceTier: e.target.value as PriceTier })}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                {PRICE_TIERS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">Opening Time</label>
              <input
                type="time"
                value={editRest.openingTime || ""}
                onChange={(e) => setEditRest({ ...editRest, openingTime: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">Closing Time</label>
              <input
                type="time"
                value={editRest.closingTime || ""}
                onChange={(e) => setEditRest({ ...editRest, closingTime: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={saveRestaurant}
              className="px-5 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
            >
              Save Changes
            </button>
            {restSaved && <span className="text-sm text-green-600 font-medium">✓ Saved!</span>}
          </div>
        </div>
      )}

      {/* ── Menu Tab ── */}
      {activeTab === "menu" && (
        <div>
          {/* Add item */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5 max-w-2xl">
            <h3 className="font-semibold text-gray-800 mb-4">Add Menu Item</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-medium">Item Name</label>
                <input type="text" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-medium">Category</label>
                <input type="text" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  placeholder="Main Course, Starters…"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500 mb-1 font-medium">Description</label>
                <input type="text" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-medium">Price (₹)</label>
                <input type="number" min={0} value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-700">
                  <div onClick={() => setNewItem({ ...newItem, isVeg: !newItem.isVeg })}
                    className={`w-10 h-5 rounded-full relative transition-colors ${newItem.isVeg ? "bg-green-500" : "bg-red-400"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${newItem.isVeg ? "left-5" : "left-0.5"}`} />
                  </div>
                  {newItem.isVeg ? "🌿 Vegetarian" : "🍖 Non-Veg"}
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button onClick={saveNewMenuItem}
                className="px-5 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
                Add Item
              </button>
              {itemSaved && <span className="text-sm text-green-600 font-medium">✓ Added!</span>}
            </div>
          </div>

          {/* Menu search */}
          <div className="mb-4 max-w-2xl">
            <input
              type="text"
              placeholder="Filter menu items by name or category…"
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Menu list */}
          <div className="space-y-2">
            {filteredMenuItems.length === 0 && (
              <p className="text-gray-400 text-sm py-4 text-center">
                {menuItems.length === 0 ? "No menu items yet." : "No menu items match your search."}
              </p>
            )}
            {filteredMenuItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${item.isVeg ? "bg-green-500" : "bg-red-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${item.available ? "text-gray-800" : "text-gray-400 line-through"}`}>
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-400">{item.category} · ₹{item.price}</p>
                </div>
                <button
                  onClick={() => toggleItemAvailability(item)}
                  className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
                    item.available
                      ? "border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
                      : "border-gray-200 text-gray-500 bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  {item.available ? "Available" : "Unavailable"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tables Tab ── */}
      {activeTab === "tables" && (
        <div>
          {/* Add table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5 max-w-xl">
            <h3 className="font-semibold text-gray-800 mb-4">Add Table</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-medium">Label</label>
                <input type="text" value={newTable.label} onChange={(e) => setNewTable({ ...newTable, label: e.target.value })}
                  placeholder="T-07"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-medium">Capacity</label>
                <input type="number" min={1} max={20} value={newTable.capacity}
                  onChange={(e) => setNewTable({ ...newTable, capacity: Number(e.target.value) })}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-medium">Section</label>
                <select value={newTable.section} onChange={(e) => setNewTable({ ...newTable, section: e.target.value as SeatingSection })}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400">
                  {SECTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button onClick={saveNewTable}
                className="px-5 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
                Add Table
              </button>
              {tableSaved && <span className="text-sm text-green-600 font-medium">✓ Added!</span>}
            </div>
          </div>

          {/* Tables list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tables.length === 0 && (
              <p className="text-gray-400 text-sm py-4">No tables configured yet.</p>
            )}
            {tables.map((table) => (
              <div key={table.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-800">{table.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    table.status === "Available" ? "bg-green-100 text-green-700" :
                    table.status === "Reserved" ? "bg-blue-100 text-blue-700" :
                    table.status === "Occupied" ? "bg-orange-100 text-orange-700" :
                    table.status === "Cleaning" ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-500"
                  }`}>{table.status}</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{table.section}</p>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 font-medium">Capacity:</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={table.capacity}
                    onChange={(e) => updateTableCapacity(table, Number(e.target.value))}
                    className="w-16 text-sm border border-gray-200 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <span className="text-xs text-gray-400">guests</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Reservations Tab ── */}
      {activeTab === "reservations" && (
        <div className="space-y-3">
          {reservations.length === 0 && (
            <p className="text-gray-400 text-sm py-8 text-center">No reservations yet.</p>
          )}
          {[...reservations]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((res) => {
              const table = store.tables.find((t) => t.id === res.tableId);
              return (
                <div key={res.id} className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs font-bold text-orange-600">{res.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[res.status]}`}>{res.status}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{res.guestName}</p>
                    <p className="text-xs text-gray-400">{res.date} at {res.timeSlot} · {res.partySize} guests · {table?.label} ({table?.section})</p>
                  </div>
                  <span className="text-xs text-gray-400">{res.guestEmail}</span>
                </div>
              );
            })}
        </div>
      )}
      </div>
    </RoleGuard>
  );
}
