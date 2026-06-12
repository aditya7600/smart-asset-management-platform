import { prisma } from "../../lib/prisma.js";
import { BookingStatus } from "../../utils/constants.js";

// Sweeps issued bookings whose due date has passed and flags them OVERDUE.
// Called before any listing/analytics read so statuses are always current
// without needing a background scheduler (which is documented as a future extension).
export async function markOverdueBookings(): Promise<number> {
  const now = new Date();
  const result = await prisma.booking.updateMany({
    where: {
      status: BookingStatus.ISSUED,
      dueDate: { lt: now },
    },
    data: { status: BookingStatus.OVERDUE },
  });
  return result.count;
}
