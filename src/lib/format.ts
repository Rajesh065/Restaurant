/**
 * Formats a numeric amount in Indian Rupees (e.g. 1250 -> "₹1,250").
 */
export function formatCurrencyINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Converts a 24-hour "HH:MM" time slot into a 12-hour label (e.g. "19:30" -> "7:30 PM").
 */
export function formatTimeSlot12h(timeSlot: string): string {
  const [hourStr, minuteStr] = timeSlot.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return timeSlot;
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

/**
 * Checks whether a restaurant is currently open given its "HH:MM" opening and closing times.
 */
export function isRestaurantOpenNow(
  openingTime: string,
  closingTime: string,
  now: Date = new Date()
): boolean {
  const toMinutes = (hhmm: string): number | null => {
    const [h, m] = hhmm.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  };
  const openMin = toMinutes(openingTime);
  const closeMin = toMinutes(closingTime);
  if (openMin === null || closeMin === null) return false;
  const currentMin = now.getHours() * 60 + now.getMinutes();
  if (closeMin >= openMin) {
    return currentMin >= openMin && currentMin < closeMin;
  }
  return currentMin >= openMin || currentMin < closeMin;
}
