import type { BookingStatus, AssetStatus, AssetCondition } from "../types";

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function daysUntil(value?: string | null): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

// Tailwind colour classes for each booking status badge.
export const bookingStatusStyle: Record<BookingStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-rose-100 text-rose-700",
  ISSUED: "bg-violet-100 text-violet-700",
  RETURNED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-slate-100 text-slate-600",
  OVERDUE: "bg-red-100 text-red-700",
};

export const assetStatusStyle: Record<AssetStatus, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-700",
  UNAVAILABLE: "bg-slate-100 text-slate-600",
  MAINTENANCE: "bg-amber-100 text-amber-700",
  RETIRED: "bg-rose-100 text-rose-700",
};

export const conditionStyle: Record<AssetCondition, string> = {
  EXCELLENT: "bg-emerald-100 text-emerald-700",
  GOOD: "bg-blue-100 text-blue-700",
  FAIR: "bg-amber-100 text-amber-700",
  POOR: "bg-orange-100 text-orange-700",
  DAMAGED: "bg-rose-100 text-rose-700",
};

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
