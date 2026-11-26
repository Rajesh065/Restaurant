"use client";

import { SEED_DATA } from "@/data/seed";
import type {
  DineEaseStore,
  Reservation,
  ReservationStatus,
  Restaurant,
  MenuItem,
  Table,
  TableStatus,
} from "@/types/dineease";
import { STATUS_TRANSITIONS } from "@/types/dineease";

const STORAGE_KEY = "dineease_store";

// ─── Load / Save ─────────────────────────────────────────────────────────────
export function loadStore(): DineEaseStore {
  if (typeof window === "undefined") return SEED_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveStore(SEED_DATA);
      return SEED_DATA;
    }
    return JSON.parse(raw) as DineEaseStore;
  } catch {
    return SEED_DATA;
  }
}

export function saveStore(store: DineEaseStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function resetStore(): DineEaseStore {
  saveStore(SEED_DATA);
  return SEED_DATA;
}

// ─── Reference Code Generator ────────────────────────────────────────────────
export function generateRefCode(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `BK-${year}-${rand}`;
}

// ─── Conflict / Availability Check ───────────────────────────────────────────
/**
 * Returns true if a table is already booked on the given date + time slot
 * (checks only active, non-cancelled/completed reservations).
 */
export function isTableBooked(
  store: DineEaseStore,
  tableId: string,
  date: string,
  timeSlot: string,
  excludeReservationId?: string
): boolean {
  const ACTIVE: ReservationStatus[] = ["Confirmed", "Checked In", "Seated"];
  return store.reservations.some(
    (r) =>
      r.tableId === tableId &&
      r.date === date &&
      r.timeSlot === timeSlot &&
      ACTIVE.includes(r.status) &&
      r.id !== excludeReservationId
  );
}

/**
 * Returns available tables for a restaurant that fit the party size and
 * have no conflicting reservation.
 */
export function getAvailableTables(
  store: DineEaseStore,
  restaurantId: string,
  date: string,
  timeSlot: string,
  partySize: number
): Table[] {
  return store.tables.filter(
    (t) =>
      t.restaurantId === restaurantId &&
      t.capacity >= partySize &&
      t.status !== "Unavailable" &&
      !isTableBooked(store, t.id, date, timeSlot)
  );
}

// ─── CRUD helpers ────────────────────────────────────────────────────────────

// Reservations
export function addReservation(
  store: DineEaseStore,
  reservation: Reservation
): DineEaseStore {
  const next = {
    ...store,
    reservations: [...store.reservations, reservation],
  };
  saveStore(next);
  return next;
}

export function updateReservationStatus(
  store: DineEaseStore,
  reservationId: string,
  newStatus: ReservationStatus
): { store: DineEaseStore; error?: string } {
  const res = store.reservations.find((r) => r.id === reservationId);
  if (!res) return { store, error: "Reservation not found" };
  const allowed = STATUS_TRANSITIONS[res.status];
  if (!allowed.includes(newStatus)) {
    return {
      store,
      error: `Cannot move from ${res.status} → ${newStatus}`,
    };
  }
  const next = {
    ...store,
    reservations: store.reservations.map((r) =>
      r.id === reservationId ? { ...r, status: newStatus } : r
    ),
  };
  saveStore(next);
  return { store: next };
}

export function cancelReservation(
  store: DineEaseStore,
  reservationId: string
): DineEaseStore {
  const next = {
    ...store,
    reservations: store.reservations.map((r) =>
      r.id === reservationId ? { ...r, status: "Cancelled" as ReservationStatus } : r
    ),
  };
  saveStore(next);
  return next;
}

// Restaurants
export function updateRestaurant(
  store: DineEaseStore,
  updated: Restaurant
): DineEaseStore {
  const next = {
    ...store,
    restaurants: store.restaurants.map((r) =>
      r.id === updated.id ? updated : r
    ),
  };
  saveStore(next);
  return next;
}

export function addRestaurant(
  store: DineEaseStore,
  restaurant: Restaurant
): DineEaseStore {
  const next = { ...store, restaurants: [...store.restaurants, restaurant] };
  saveStore(next);
  return next;
}

// Menu Items
export function addMenuItem(
  store: DineEaseStore,
  item: MenuItem
): DineEaseStore {
  const next = { ...store, menuItems: [...store.menuItems, item] };
  saveStore(next);
  return next;
}

export function updateMenuItem(
  store: DineEaseStore,
  updated: MenuItem
): DineEaseStore {
  const next = {
    ...store,
    menuItems: store.menuItems.map((m) => (m.id === updated.id ? updated : m)),
  };
  saveStore(next);
  return next;
}

// Tables
export function addTable(store: DineEaseStore, table: Table): DineEaseStore {
  const next = { ...store, tables: [...store.tables, table] };
  saveStore(next);
  return next;
}

export function updateTable(
  store: DineEaseStore,
  updated: Table
): DineEaseStore {
  const next = {
    ...store,
    tables: store.tables.map((t) => (t.id === updated.id ? updated : t)),
  };
  saveStore(next);
  return next;
}

export function updateTableStatus(
  store: DineEaseStore,
  tableId: string,
  status: TableStatus
): DineEaseStore {
  const next = {
    ...store,
    tables: store.tables.map((t) =>
      t.id === tableId ? { ...t, status } : t
    ),
  };
  saveStore(next);
  return next;
}

// ─── Metrics ─────────────────────────────────────────────────────────────────
export function getMetrics(store: DineEaseStore) {
  const totalRestaurants = store.restaurants.length;
  const approvedRestaurants = store.restaurants.filter(
    (r) => r.status === "approved"
  ).length;
  const pendingRestaurants = store.restaurants.filter(
    (r) => r.status === "pending"
  ).length;
  const totalBookings = store.reservations.length;
  const activeBookings = store.reservations.filter((r) =>
    ["Confirmed", "Checked In", "Seated"].includes(r.status)
  ).length;
  const depositsCollected = store.reservations
    .filter((r) => r.status !== "Cancelled")
    .reduce((sum, r) => sum + r.depositAmount, 0);
  return {
    totalRestaurants,
    approvedRestaurants,
    pendingRestaurants,
    totalBookings,
    activeBookings,
    depositsCollected,
  };
}
