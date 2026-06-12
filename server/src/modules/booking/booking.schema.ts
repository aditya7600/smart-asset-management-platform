import { z } from "zod";

export const createBookingSchema = z
  .object({
    assetId: z.string().min(1, "Asset is required"),
    quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    purpose: z.string().max(500).optional(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export const reviewSchema = z.object({
  note: z.string().max(500).optional(),
});

export const listBookingsQuerySchema = z.object({
  status: z
    .enum([
      "PENDING",
      "APPROVED",
      "REJECTED",
      "ISSUED",
      "RETURNED",
      "CANCELLED",
      "OVERDUE",
    ])
    .optional(),
  scope: z.enum(["mine", "all"]).default("mine"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;
