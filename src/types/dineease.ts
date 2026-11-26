// ─── Role ────────────────────────────────────────────────────────────────────
export type Role = "customer" | "owner" | "staff" | "admin";

export const ROLE_HOME: Record<Role, string> = {
  customer: "/",
  owner: "/owner",
  staff: "/staff",
  admin: "/admin",
};

export const ROLE_LABELS: Record<Role, string> = {
  customer: "Customer",
  owner: "Restaurant Owner",
  staff: "Restaurant Staff",
  admin: "Super Admin",
};

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  ownerId?: string;
  restaurantId?: string;
}

// ─── Cuisine / Pricing ───────────────────────────────────────────────────────
export type CuisineType =
  | "Indian"
  | "Italian"
  | "Chinese"
  | "Mexican"
  | "Japanese"
  | "American"
  | "Mediterranean"
  | "Thai"
  | "French"
  | "Fusion";

export type PriceTier = "$" | "$$" | "$$$" | "$$$$";

// ─── Seating section ─────────────────────────────────────────────────────────
export type SeatingSection = "Indoor" | "Outdoor" | "Rooftop" | "Bar" | "Private";

// ─── Restaurant status ───────────────────────────────────────────────────────
export type RestaurantStatus = "approved" | "pending" | "suspended";

// ─── Menu item ───────────────────────────────────────────────────────────────
export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isVeg: boolean;
  available: boolean;
}

// ─── Table ───────────────────────────────────────────────────────────────────
export type TableStatus = "Available" | "Reserved" | "Occupied" | "Cleaning" | "Unavailable";

export interface Table {
  id: string;
  restaurantId: string;
  label: string;           // e.g. "T-01"
  capacity: number;        // max seats
  section: SeatingSection;
  status: TableStatus;
}

// ─── Reservation ─────────────────────────────────────────────────────────────
export type ReservationStatus =
  | "Confirmed"
  | "Checked In"
  | "Seated"
  | "Completed"
  | "Cancelled"
  | "No Show";

export interface Reservation {
  id: string;             // booking reference
  restaurantId: string;
  tableId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  partySize: number;
  date: string;           // YYYY-MM-DD
  timeSlot: string;       // e.g. "19:00"
  specialRequests: string;
  status: ReservationStatus;
  depositAmount: number;
  createdAt: string;      // ISO
  isWalkIn: boolean;
}

// ─── Restaurant ──────────────────────────────────────────────────────────────
export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine: CuisineType;
  country: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  priceTier: PriceTier;
  rating: number;
  reviewCount: number;
  coverImage: string;     // emoji placeholder
  hasVegOptions: boolean;
  openingTime: string;    // "HH:MM"
  closingTime: string;    // "HH:MM"
  status: RestaurantStatus;
  ownerId: string;
  tags: string[];
}

// ─── Store shape ─────────────────────────────────────────────────────────────
export interface DineEaseStore {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  tables: Table[];
  reservations: Reservation[];
}

// ─── Allowed status transitions for Staff ────────────────────────────────────
export const STATUS_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  Confirmed: ["Checked In", "Cancelled", "No Show"],
  "Checked In": ["Seated", "Cancelled", "No Show"],
  Seated: ["Completed", "Cancelled"],
  Completed: [],
  Cancelled: [],
  "No Show": [],
};

// ─── Time slots ──────────────────────────────────────────────────────────────
export const TIME_SLOTS: string[] = [
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30",
];
