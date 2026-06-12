// Centralised string-enum definitions shared across the backend.
export const Role = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

export const AssetStatus = {
  AVAILABLE: "AVAILABLE",
  UNAVAILABLE: "UNAVAILABLE",
  MAINTENANCE: "MAINTENANCE",
  RETIRED: "RETIRED",
} as const;

export const AssetCondition = {
  EXCELLENT: "EXCELLENT",
  GOOD: "GOOD",
  FAIR: "FAIR",
  POOR: "POOR",
  DAMAGED: "DAMAGED",
} as const;

export const BookingStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  ISSUED: "ISSUED",
  RETURNED: "RETURNED",
  CANCELLED: "CANCELLED",
  OVERDUE: "OVERDUE",
} as const;

export const MaintenanceType = {
  MAINTENANCE: "MAINTENANCE",
  DAMAGE_REPORT: "DAMAGE_REPORT",
  REPAIR: "REPAIR",
} as const;

export const MaintenanceStatus = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
} as const;

export const NotificationType = {
  INFO: "INFO",
  SUCCESS: "SUCCESS",
  WARNING: "WARNING",
  ERROR: "ERROR",
} as const;
