import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CalendarCheck, X } from "lucide-react";
import { api, getErrorMessage } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Spinner, EmptyState } from "../components/ui/States";
import { BookingStatusBadge } from "../components/StatusBadge";
import { formatDate, daysUntil } from "../lib/format";
import type { Booking, Pagination as PaginationType, BookingStatus } from "../types";

const FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Issued", value: "ISSUED" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "Returned", value: "RETURNED" },
];

export default function MyBookings() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["bookings", "mine", filter],
    queryFn: async () => {
      const params = new URLSearchParams({ scope: "mine", pageSize: "50" });
      if (filter) params.set("status", filter);
      const res = await api.get<{ bookings: Booking[]; pagination: PaginationType }>(
        `/bookings?${params.toString()}`
      );
      return res.data.bookings;
    },
  });

  const cancel = useMutation({
    mutationFn: (bookingId: string) => api.patch(`/bookings/${bookingId}/cancel`),
    onSuccess: () => {
      toast.success("Booking cancelled");
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div>
      <PageHeader title="My Bookings" subtitle="Track your requests, active loans and history." />

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              filter === f.value
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner label="Loading your bookings…" />
      ) : data && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((b) => (
            <BookingRow key={b.id} booking={b} onCancel={() => cancel.mutate(b.id)} canceling={cancel.isPending} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<CalendarCheck className="h-7 w-7" />}
          title="No bookings here"
          description="Browse the catalog and request an asset to get started."
        />
      )}
    </div>
  );
}

function BookingRow({
  booking,
  onCancel,
  canceling,
}: {
  booking: Booking;
  onCancel: () => void;
  canceling: boolean;
}) {
  const cancellable = (["PENDING", "APPROVED"] as BookingStatus[]).includes(booking.status);
  const due = booking.status === "ISSUED" || booking.status === "OVERDUE" ? daysUntil(booking.dueDate) : null;

  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-800">{booking.asset?.name}</h3>
          <BookingStatusBadge status={booking.status} />
        </div>
        <p className="mt-0.5 text-sm text-slate-500">
          Qty {booking.quantity} · {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
        </p>
        {booking.purpose && <p className="mt-1 text-sm text-slate-400">“{booking.purpose}”</p>}
        {booking.reviewNote && (
          <p className="mt-1 text-sm text-slate-500">
            <span className="font-medium">Admin note:</span> {booking.reviewNote}
          </p>
        )}
        {due !== null && (
          <p className={`mt-1 text-sm font-medium ${due < 0 ? "text-rose-600" : "text-slate-500"}`}>
            {due < 0 ? `Overdue by ${Math.abs(due)} day(s)` : `Due in ${due} day(s)`}
          </p>
        )}
      </div>
      {cancellable && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onCancel}
          loading={canceling}
          icon={<X className="h-4 w-4" />}
        >
          Cancel
        </Button>
      )}
    </Card>
  );
}
