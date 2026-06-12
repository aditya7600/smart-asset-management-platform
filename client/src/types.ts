// Shared domain types mirroring the backend API responses.

export type Role = "ADMIN" | "USER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  assetCount?: number;
}

export type AssetStatus = "AVAILABLE" | "UNAVAILABLE" | "MAINTENANCE" | "RETIRED";
export type AssetCondition = "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "DAMAGED";

export interface Asset {
  id: string;
  name: string;
  description?: string | null;
  categoryId: string;
  category?: { id: string; name: string };
  totalQuantity: number;
  availableQuantity: number;
  status: AssetStatus;
  condition: AssetCondition;
  location?: string | null;
  imageUrl?: string | null;
  qrCode: string;
  createdAt: string;
  updatedAt: string;
  maintenance?: MaintenanceRecord[];
  bookings?: Booking[];
}

export type BookingStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "ISSUED"
  | "RETURNED"
  | "CANCELLED"
  | "OVERDUE";

export interface Booking {
  id: string;
  userId: string;
  assetId: string;
  quantity: number;
  startDate: string;
  endDate: string;
  purpose?: string | null;
  status: BookingStatus;
  reviewNote?: string | null;
  issuedAt?: string | null;
  returnedAt?: string | null;
  dueDate?: string | null;
  createdAt: string;
  asset?: { id: string; name: string; category?: { name: string } };
  user?: { id: string; name: string; email: string };
  reviewedBy?: { id: string; name: string } | null;
}

export interface Notification {
  id: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorName?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: string | null;
  createdAt: string;
  user?: { name: string; email: string } | null;
}

export type MaintenanceType = "MAINTENANCE" | "DAMAGE_REPORT" | "REPAIR";
export type MaintenanceStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  description: string;
  cost?: number | null;
  resolvedAt?: string | null;
  createdAt: string;
  asset?: { id: string; name: string };
  reportedBy?: { id: string; name: string } | null;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
