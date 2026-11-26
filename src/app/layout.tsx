import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "DineEase — Multi-Restaurant Reservation Marketplace",
  description: "Discover, book, and manage restaurant reservations with ease.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <Suspense fallback={<div className="h-16 bg-white border-b border-gray-200" />}>
          <Navbar />
        </Suspense>
        <main className="w-full px-4 sm:px-6 lg:px-10 py-6">
          {children}
        </main>
        <footer className="mt-16 border-t border-gray-200 py-8 text-center text-sm text-gray-400">
          <p>DineEase Demo &copy; 2026 — All data is stored locally in your browser.</p>
        </footer>
      </body>
    </html>
  );
}
