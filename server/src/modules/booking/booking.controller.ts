import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { BookingStatus, Role } from "../../utils/constants.js";
import { recordAudit } from "../../services/audit.service.js";
import { notify } from "../../services/notification.service.js";
import { markOverdueBookings } from "./booking.service.js";
import type {
  CreateBookingInput,
  ReviewInput,
  ListBookingsQuery,
} from "./booking.schema.js";

const bookingInclude = {
  asset: { select: { id: true, name: true, category: { select: { name: true } } } },
  user: { select: { id: true, name: true, email: true } },
  reviewedBy: { select: { id: true, name: true } },
} as const;

// POST /api/bookings — a user requests an asset for a date range.
export async function createBooking(req: Request, res: Response) {
  const data = req.body as CreateBookingInput;

  const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
  if (!asset) throw ApiError.notFound("Asset not found");

  if (asset.status === "RETIRED") {
    throw ApiError.badRequest("This asset is retired and cannot be booked");
  }
  // Guard against requesting more than physically exists.
  if (data.quantity > asset.totalQuantity) {
    throw ApiError.badRequest(
      `Requested quantity (${data.quantity}) exceeds total inventory (${asset.totalQuantity}).`
    );
  }
  // Guard against requesting more than currently available.
  if (data.quantity > asset.availableQuantity) {
    throw ApiError.badRequest(
      `Only ${asset.availableQuantity} unit(s) are currently available.`
    );
  }

  const booking = await prisma.booking.create({
    data: {
      userId: req.user!.id,
      assetId: data.assetId,
      quantity: data.quantity,
      startDate: data.startDate,
      endDate: data.endDate,
      purpose: data.purpose,
      status: BookingStatus.PENDING,
    },
    include: bookingInclude,
  });

  await recordAudit({
    userId: req.user!.id,
    actorName: req.user!.email,
    action: "BOOKING_REQUESTED",
    entityType: "Booking",
    entityId: booking.id,
    details: `Requested ${data.quantity} × ${asset.name}`,
  });

  // Notify all administrators of the new request.
  const admins = await prisma.user.findMany({ where: { role: Role.ADMIN } });
  await Promise.all(
    admins.map((a) =>
      notify({
        userId: a.id,
        type: "INFO",
        title: "New booking request",
        message: `${req.user!.email} requested ${data.quantity} × ${asset.name}.`,
        link: "/admin/requests",
      })
    )
  );

  res.status(201).json({ booking });
}

// GET /api/bookings — own bookings, or all bookings for admins.
export async function listBookings(req: Request, res: Response) {
  await markOverdueBookings();
  const q = req.query as unknown as ListBookingsQuery;
  const isAdmin = req.user!.role === Role.ADMIN;

  const where: Record<string, unknown> = {};
  if (q.scope === "all" && isAdmin) {
    // admin sees everything
  } else {
    where.userId = req.user!.id;
  }
  if (q.status) where.status = q.status;

  const [total, bookings] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      include: bookingInclude,
    }),
  ]);

  res.json({
    bookings,
    pagination: {
      page: q.page,
      pageSize: q.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    },
  });
}

export async function getBooking(req: Request, res: Response) {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: bookingInclude,
  });
  if (!booking) throw ApiError.notFound("Booking not found");
  // Users may only view their own bookings.
  if (req.user!.role !== Role.ADMIN && booking.userId !== req.user!.id) {
    throw ApiError.forbidden();
  }
  res.json({ booking });
}

// PATCH /api/bookings/:id/approve — admin approves a pending request.
// Reserves inventory atomically inside a transaction to prevent overbooking.
export async function approveBooking(req: Request, res: Response) {
  const { id } = req.params;
  const { note } = req.body as ReviewInput;

  const booking = await prisma.$transaction(async (tx) => {
    const existing = await tx.booking.findUnique({ where: { id }, include: { asset: true } });
    if (!existing) throw ApiError.notFound("Booking not found");
    if (existing.status !== BookingStatus.PENDING) {
      throw ApiError.conflict(`Only pending requests can be approved (current: ${existing.status}).`);
    }
    if (existing.quantity > existing.asset.availableQuantity) {
      throw ApiError.conflict(
        `Cannot approve — only ${existing.asset.availableQuantity} unit(s) available now.`
      );
    }

    // Reserve the units now (availableQuantity reflects un-committed stock).
    await tx.asset.update({
      where: { id: existing.assetId },
      data: { availableQuantity: { decrement: existing.quantity } },
    });

    return tx.booking.update({
      where: { id },
      data: {
        status: BookingStatus.APPROVED,
        reviewedById: req.user!.id,
        reviewNote: note,
      },
      include: bookingInclude,
    });
  });

  await recordAudit({
    userId: req.user!.id,
    actorName: req.user!.email,
    action: "BOOKING_APPROVED",
    entityType: "Booking",
    entityId: booking.id,
    details: `Approved ${booking.quantity} × ${booking.asset.name}`,
  });
  await notify({
    userId: booking.userId,
    type: "SUCCESS",
    title: "Booking approved",
    message: `Your request for ${booking.quantity} × ${booking.asset.name} was approved.`,
    link: "/my-bookings",
  });

  res.json({ booking });
}

// PATCH /api/bookings/:id/reject — admin rejects a pending request.
export async function rejectBooking(req: Request, res: Response) {
  const { id } = req.params;
  const { note } = req.body as ReviewInput;

  const existing = await prisma.booking.findUnique({ where: { id }, include: { asset: true } });
  if (!existing) throw ApiError.notFound("Booking not found");
  if (existing.status !== BookingStatus.PENDING) {
    throw ApiError.conflict(`Only pending requests can be rejected (current: ${existing.status}).`);
  }

  const booking = await prisma.booking.update({
    where: { id },
    data: { status: BookingStatus.REJECTED, reviewedById: req.user!.id, reviewNote: note },
    include: bookingInclude,
  });

  await recordAudit({
    userId: req.user!.id,
    actorName: req.user!.email,
    action: "BOOKING_REJECTED",
    entityType: "Booking",
    entityId: booking.id,
    details: note ? `Rejected: ${note}` : "Rejected",
  });
  await notify({
    userId: booking.userId,
    type: "WARNING",
    title: "Booking rejected",
    message: `Your request for ${booking.asset.name} was rejected.${note ? ` Reason: ${note}` : ""}`,
    link: "/my-bookings",
  });

  res.json({ booking });
}

// PATCH /api/bookings/:id/issue — admin hands the asset over to the user.
export async function issueBooking(req: Request, res: Response) {
  const { id } = req.params;

  const existing = await prisma.booking.findUnique({ where: { id }, include: { asset: true } });
  if (!existing) throw ApiError.notFound("Booking not found");
  if (existing.status !== BookingStatus.APPROVED) {
    throw ApiError.conflict(`Only approved bookings can be issued (current: ${existing.status}).`);
  }

  const booking = await prisma.booking.update({
    where: { id },
    data: {
      status: BookingStatus.ISSUED,
      issuedAt: new Date(),
      dueDate: existing.endDate,
    },
    include: bookingInclude,
  });

  await recordAudit({
    userId: req.user!.id,
    actorName: req.user!.email,
    action: "BOOKING_ISSUED",
    entityType: "Booking",
    entityId: booking.id,
    details: `Issued ${booking.quantity} × ${booking.asset.name}`,
  });
  await notify({
    userId: booking.userId,
    type: "INFO",
    title: "Asset issued",
    message: `${booking.quantity} × ${booking.asset.name} has been issued. Due ${booking.dueDate?.toLocaleDateString()}.`,
    link: "/my-bookings",
  });

  res.json({ booking });
}

// PATCH /api/bookings/:id/return — admin records the asset's return.
export async function returnBooking(req: Request, res: Response) {
  const { id } = req.params;

  const booking = await prisma.$transaction(async (tx) => {
    const existing = await tx.booking.findUnique({ where: { id }, include: { asset: true } });
    if (!existing) throw ApiError.notFound("Booking not found");
    if (existing.status !== BookingStatus.ISSUED && existing.status !== BookingStatus.OVERDUE) {
      throw ApiError.conflict(`Only issued assets can be returned (current: ${existing.status}).`);
    }

    // Release the reserved units back into available inventory.
    await tx.asset.update({
      where: { id: existing.assetId },
      data: { availableQuantity: { increment: existing.quantity } },
    });

    return tx.booking.update({
      where: { id },
      data: { status: BookingStatus.RETURNED, returnedAt: new Date() },
      include: bookingInclude,
    });
  });

  await recordAudit({
    userId: req.user!.id,
    actorName: req.user!.email,
    action: "BOOKING_RETURNED",
    entityType: "Booking",
    entityId: booking.id,
    details: `Returned ${booking.quantity} × ${booking.asset.name}`,
  });
  await notify({
    userId: booking.userId,
    type: "SUCCESS",
    title: "Return recorded",
    message: `Return of ${booking.quantity} × ${booking.asset.name} has been recorded. Thank you!`,
    link: "/my-bookings",
  });

  res.json({ booking });
}

// PATCH /api/bookings/:id/cancel — a user cancels their own pending/approved booking.
export async function cancelBooking(req: Request, res: Response) {
  const { id } = req.params;

  const booking = await prisma.$transaction(async (tx) => {
    const existing = await tx.booking.findUnique({ where: { id }, include: { asset: true } });
    if (!existing) throw ApiError.notFound("Booking not found");
    if (req.user!.role !== Role.ADMIN && existing.userId !== req.user!.id) {
      throw ApiError.forbidden();
    }
    if (existing.status !== BookingStatus.PENDING && existing.status !== BookingStatus.APPROVED) {
      throw ApiError.conflict(
        `Only pending or approved bookings can be cancelled (current: ${existing.status}).`
      );
    }
    // If it was approved, units were reserved — release them.
    if (existing.status === BookingStatus.APPROVED) {
      await tx.asset.update({
        where: { id: existing.assetId },
        data: { availableQuantity: { increment: existing.quantity } },
      });
    }
    return tx.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
      include: bookingInclude,
    });
  });

  await recordAudit({
    userId: req.user!.id,
    actorName: req.user!.email,
    action: "BOOKING_CANCELLED",
    entityType: "Booking",
    entityId: booking.id,
  });

  res.json({ booking });
}
