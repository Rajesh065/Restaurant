# DineEase — Multi-Restaurant Reservation Marketplace

A fully functional, multi-role restaurant reservation marketplace built with **Next.js 16 (App Router)**, **TypeScript**, and **Tailwind CSS v4**. All data lives in the browser via `localStorage` — no database, backend, or authentication service required.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏗️ Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Persistence | `localStorage` (browser-only) |
| Data | Seeded local data (`src/data/seed.ts`) |

---

## 👥 Roles

Switch roles using the **role picker** in the top navigation bar. The selection is persisted in `localStorage` across page refreshes.

| Role | Key Pages | Description |
|---|---|---|
| **Customer** | `/`, `/restaurants/[id]`, `/bookings` | Browse, filter, and reserve tables; manage reservations |
| **Restaurant Owner** | `/owner` | Edit restaurant details, manage menu and tables, view reservations |
| **Staff** | `/staff` | Manage live reservations, update statuses, log walk-ins, toggle table statuses |
| **Super Admin** | `/admin` | View marketplace metrics, approve/suspend restaurants, reset demo data |

---

## 📁 File Structure

```
src/
├── app/
│   ├── layout.tsx                   # Root layout with Navbar
│   ├── page.tsx                     # Marketplace discovery (/)
│   ├── bookings/page.tsx            # Customer reservations (/bookings)
│   ├── restaurants/[id]/page.tsx    # Restaurant profile + booking form
│   ├── owner/page.tsx               # Owner management panel (/owner)
│   ├── staff/page.tsx               # Staff daily operations (/staff)
│   └── admin/page.tsx               # Super admin panel (/admin)
├── components/
│   └── Navbar.tsx                   # Nav links, role switcher, Reset Demo Data
├── data/
│   └── seed.ts                      # 8 restaurants, 29 menu items, 26 tables, 5 reservations
├── lib/
│   └── store.ts                     # localStorage load/save/reset, conflict checks, CRUD helpers
└── types/
    └── dineease.ts                  # Shared TypeScript types and status enums
```

---

## 🔑 Key Features

### Customer
- **Search & Filter**: by name, city, cuisine, price tier, seating section, party size, and veg-only toggle
- **Restaurant Detail**: full menu with veg/non-veg filter, table availability by date + time slot
- **Booking**: conflict-checked reservation (prevents double-booking on the same table/date/time), generates a unique reference code
- **My Bookings**: view all reservations, cancel `Confirmed` or `Checked In` reservations

### Restaurant Owner
- **Details**: edit name, description, cuisine, city, address, hours, pricing
- **Menu**: add new items, toggle availability
- **Tables**: add tables with section and capacity; update seat counts
- **Reservations**: read-only view of all bookings for owned restaurant(s)

### Staff
- **Daily Operations**: filter reservations by date and status
- **Status Updates**: advance reservations through the lifecycle (`Confirmed → Checked In → Seated → Completed`, plus `Cancelled` and `No Show`) with valid transition enforcement
- **Walk-In Logging**: log walk-in guests directly as `Seated`
- **Live Table Board**: toggle each table between `Available`, `Reserved`, `Occupied`, `Cleaning`, `Unavailable`

### Super Admin
- **Metrics Dashboard**: total restaurants, approved/pending counts, total/active bookings, total deposits collected
- **Booking Breakdown**: count by each status
- **Restaurant Registry**: approve or suspend any restaurant; search and filter by status
- **Recent Reservations**: latest 10 bookings across all restaurants
- **Reset Demo Data**: restores `localStorage` to seed state

---

## 💾 Data & Persistence

> [!IMPORTANT]
> All conflict checks, booking logic, and data mutations operate on **local browser state** stored in `localStorage`. There is no database, API, or server-side persistence. Clearing browser data will reset the app to seed state.

### How it works

1. On first load, `src/lib/store.ts` checks `localStorage` for `dineease_store`
2. If absent, it seeds from `src/data/seed.ts` and writes to `localStorage`
3. Every mutation (reserve, cancel, update status, etc.) reads, modifies, and writes the full store back to `localStorage`
4. The **Reset Demo Data** button (in the navbar role menu or admin panel) calls `resetStore()` which overwrites `localStorage` with the original seed data

### Conflict checking

`isTableBooked()` in `src/lib/store.ts` checks for existing reservations on the same `(tableId, date, timeSlot)` combination with status `Confirmed`, `Checked In`, or `Seated`. The booking form also performs a second check at submit time to guard against race conditions during the same browser session.

---

## 🌱 Seed Data

| Resource | Count |
|---|---|
| Restaurants | 8 (across Mumbai, Delhi, Bangalore) |
| Menu Items | 29 |
| Tables | 26 |
| Sample Reservations | 5 |

Cuisines: Indian, Italian, Chinese, Mexican, Japanese, American, Mediterranean, Thai

---

## 📜 Scripts

```bash
npm run dev      # Start development server (Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
npx tsc --noEmit # TypeScript type check
```
