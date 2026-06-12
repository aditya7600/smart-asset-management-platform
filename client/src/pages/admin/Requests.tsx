import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Check, X, ClipboardList } from "lucide-react";
import { api, getErrorMessage } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Field, Textarea } from "../../components/ui/Field";
import { Spinner, EmptyState } from "../../components/ui/States";
import { BookingStatusBadge } from "../../components/StatusBadge";
import { formatDate } from "../../lib/format";
import type { Booking } from "../../types";

export default function Requests() {
  const qc = useQueryClient();
  const [reject, setReject] = useState<Booking | null>(null);
  const [note, setNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["bookings", "pending"],
    queryFn: async () => {
      const res = await api.get<{ bookings: Booking[] }>(
        "/bookings?scope=all&status=PENDING&pageSize=100"
      );
      return res.data.bookings;
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["bookings"] });
    qc.invalidateQueries({ queryKey: ["assets"] });
    qc.invalidateQueries({ queryKey: ["analytics"] });
  };

  const approve = useMutation({
    mutationFn: (id: string) => api.patch(`/bookings/${id}/approve`),
    onSuccess: () => {
      toast.success("Request approved");
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const rejectMut = useMutation({
    mutationFn: (id: string) => api.patch(`/bookings/${id}/reject`, { note }),
    onSuccess: () => {
      toast.success("Request rejected");
      setReject(null);
      setNote("");
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div>
      <PageHeader
        title="Booking Requests"
        subtitle="Review and act on pending asset requests."
      />

      {isLoading ? (
        <Spinner />
      ) : data && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((b) => (
            <Card key={b.id} className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-800">{b.asset?.name}</h3>
                  <BookingStatusBadge status={b.status} />
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  Requested by <span className="font-medium text-slate-700">{b.user?.name}</span> ·
                  Qty {b.quantity} · {formatDate(b.startDate)} → {formatDate(b.endDate)}
                </p>
                {b.purpose && <p className="mt-1 text-sm text-slate-400">“{b.purpose}”</p>}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="success"
                  size="sm"
                  loading={approve.isPending && approve.variables === b.id}
                  onClick={() => approve.mutate(b.id)}
                  icon={<Check className="h-4 w-4" />}
                >
                  Approve
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setReject(b)}
                  icon={<X className="h-4 w-4" />}
                >
                  Reject
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<ClipboardList className="h-7 w-7" />}
          title="No pending requests"
          description="You're all caught up. New requests will appear here."
        />
      )}

      <Modal
        open={!!reject}
        onClose={() => setReject(null)}
        title="Reject request"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReject(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={rejectMut.isPending} onClick={() => rejectMut.mutate(reject!.id)}>
              Reject request
            </Button>
          </>
        }
      >
        <Field label="Reason (optional)" hint="Shared with the requester.">
          <Textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Reserved for another event on these dates."
          />
        </Field>
      </Modal>
    </div>
  );
}
