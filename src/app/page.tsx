"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadStore } from "@/lib/store";
import RoleGuard from "@/components/RoleGuard";
import type { Restaurant, Table, CuisineType, PriceTier, SeatingSection } from "@/types/dineease";

const CITIES = ["All Cities", "Mumbai", "Delhi", "Bangalore"];
const CUISINES: (CuisineType | "All")[] = [
  "All", "Indian", "Italian", "Chinese", "Mexican", "Japanese",
  "American", "Mediterranean", "Thai", "French", "Fusion",
];
const PRICE_TIERS: (PriceTier | "All")[] = ["All", "$", "$$", "$$$", "$$$$"];
const SECTIONS: (SeatingSection | "All")[] = ["All", "Indoor", "Outdoor", "Rooftop", "Bar", "Private"];

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span className="flex items-center gap-0.5 text-yellow-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`w-3.5 h-3.5 ${i < full ? "fill-current" : half && i === full ? "fill-current opacity-50" : "fill-gray-200"}`} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-gray-600 ml-1">{rating.toFixed(1)}</span>
    </span>
  );
}

function PriceBadge({ tier }: { tier: PriceTier }) {
  const colors: Record<PriceTier, string> = {
    "$": "bg-green-100 text-green-700",
    "$$": "bg-blue-100 text-blue-700",
    "$$$": "bg-purple-100 text-purple-700",
    "$$$$": "bg-orange-100 text-orange-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[tier]}`}>
      {tier}
    </span>
  );
}

export default function HomePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => {
    if (typeof window === "undefined") return [];
    return loadStore().restaurants;
  });
  const [tables, setTables] = useState<Table[]>(() => {
    if (typeof window === "undefined") return [];
    return loadStore().tables;
  });
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("All Cities");
  const [cuisine, setCuisine] = useState<CuisineType | "All">("All");
  const [priceTier, setPriceTier] = useState<PriceTier | "All">("All");
  const [vegOnly, setVegOnly] = useState(false);
  const [partySize, setPartySize] = useState(0);
  const [section, setSection] = useState<SeatingSection | "All">("All");
  const [sortBy, setSortBy] = useState<"rating" | "reviews" | "name">("rating");

  useEffect(() => {
    function handleRoleChange() {
      const store = loadStore();
      setRestaurants(store.restaurants);
      setTables(store.tables);
    }
    window.addEventListener("dineease_role_change", handleRoleChange);
    return () => window.removeEventListener("dineease_role_change", handleRoleChange);
  }, []);

  const filtered = restaurants.filter((r) => {
    if (r.status !== "approved") return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.name.toLowerCase().includes(q) &&
        !r.city.toLowerCase().includes(q) &&
        !r.cuisine.toLowerCase().includes(q) &&
        !r.country.toLowerCase().includes(q) &&
        !r.tags.some((t) => t.toLowerCase().includes(q))
      )
        return false;
    }
    if (city !== "All Cities" && r.city !== city) return false;
    if (cuisine !== "All" && r.cuisine !== cuisine) return false;
    if (priceTier !== "All" && r.priceTier !== priceTier) return false;
    if (vegOnly && !r.hasVegOptions) return false;
    if (section !== "All" || partySize > 0) {
      const hasMatchingTable = tables.some(
        (t) =>
          t.restaurantId === r.id &&
          t.status !== "Unavailable" &&
          (section === "All" || t.section === section) &&
          (partySize <= 0 || t.capacity >= partySize)
      );
      if (!hasMatchingTable) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "reviews") return b.reviewCount - a.reviewCount;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return b.rating - a.rating;
  });

  return (
    <RoleGuard allowedRoles={["customer"]} pageTitle="Marketplace Discovery" allowGuest>
      <div>
      {/* Hero */}
      <section className="text-center py-12 mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
          Find your perfect <span className="text-orange-600">dining experience</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          Discover top restaurants, reserve a table instantly, and enjoy a seamless dining journey.
        </p>

        {/* Search */}
        <div className="mt-6 max-w-2xl mx-auto relative">
          <input
            type="text"
            placeholder="Search by restaurant, city, or cuisine…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-5 py-3 pl-12 rounded-xl border border-gray-200 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* City */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">City</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          {/* Cuisine */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Cuisine</label>
            <select
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value as CuisineType | "All")}
              className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {CUISINES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          {/* Price */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Price</label>
            <select
              value={priceTier}
              onChange={(e) => setPriceTier(e.target.value as PriceTier | "All")}
              className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {PRICE_TIERS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          {/* Section */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Seating</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value as SeatingSection | "All")}
              className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {SECTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          {/* Party size */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Party Size</label>
            <input
              type="number"
              min={0}
              max={20}
              value={partySize || ""}
              onChange={(e) => setPartySize(Number(e.target.value))}
              placeholder="Any"
              className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          {/* Veg */}
          <div className="flex flex-col justify-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-700">
              <div
                onClick={() => setVegOnly(!vegOnly)}
                className={`w-10 h-5 rounded-full relative transition-colors ${vegOnly ? "bg-green-500" : "bg-gray-200"}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${vegOnly ? "left-5" : "left-0.5"}`} />
              </div>
              Veg Only
            </label>
          </div>
        </div>
      </section>

      {/* Results header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-800">{sorted.length}</span> restaurant{sorted.length !== 1 ? "s" : ""} found
        </p>
        <div className="flex items-center gap-3">
          <select
            aria-label="Sort restaurants"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "rating" | "reviews" | "name")}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="rating">Sort: Highest Rated</option>
            <option value="reviews">Sort: Most Reviewed</option>
            <option value="name">Sort: Name (A–Z)</option>
          </select>
          {(search || city !== "All Cities" || cuisine !== "All" || priceTier !== "All" || vegOnly || partySize > 0 || section !== "All") && (
            <button
              onClick={() => {
                setSearch("");
                setCity("All Cities");
                setCuisine("All");
                setPriceTier("All");
                setVegOnly(false);
                setPartySize(0);
                setSection("All");
              }}
              className="text-xs text-orange-600 hover:text-orange-700 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Restaurant Grid */}
      {sorted.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg font-medium">No restaurants match your filters</p>
          <p className="text-sm mt-1">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {sorted.map((r) => (
            <Link key={r.id} href={`/restaurants/${r.id}`}>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group cursor-pointer h-full flex flex-col">
                {/* Cover */}
                <div className="h-36 bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center text-6xl group-hover:from-orange-100 transition-colors">
                  {r.coverImage}
                </div>
                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">{r.name}</h3>
                    <PriceBadge tier={r.priceTier} />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1 flex-wrap">
                    <span>📍</span>
                    <span>{r.city}</span>
                    <span className="mx-1">·</span>
                    <span>{r.cuisine}</span>
                    <span className="mx-1">·</span>
                    <span>🌍 {r.country}</span>
                  </div>
                  <StarRating rating={r.rating} />
                  <p className="text-xs text-gray-400 mt-0.5 mb-3">({r.reviewCount} reviews)</p>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1">
                    {r.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {r.hasVegOptions && (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">🌿 Veg</span>
                    )}
                    {r.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full border border-gray-100">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      🕐 {r.openingTime} – {r.closingTime}
                    </span>
                    <span className="text-xs font-medium text-orange-600 group-hover:underline">
                      Reserve →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      </div>
    </RoleGuard>
  );
}
