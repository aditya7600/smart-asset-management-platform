import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { PackageCheck, ArrowRightLeft, Undo2 } from "lucide-react";
import { api, getErrorMessage } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Spinner, EmptyState } from "../../components/ui/States";
import { BookingStatusBadge } from "../../components/StatusBadge";
import { formatDate, daysUntil } from "../../lib/format";
import type { Booking } from "../../types";

const TABS = [
  { label: "Ready to Issue", value: "APPROVED" },
  { label: "Issued", value: "ISSUED" },
  { label: "Overdue", value: "OVERDUE" },
];

export default function Allocations() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("APPROVED");

  const { data, isLoading } = useQuery({
    queryKey: ["bookings", "allocations", tab],
    queryFn: async () => {
      const res = await api.get<{ bookings: Booking[] }>(
        `/bookings?scope=all&status=${tab}&pageSize=100`
      );
      return res.data.bookings;
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["bookings"] });
    qc.invalidateQueries({ queryKey: ["assets"] });
    qc.invalidateQueries({ queryKey: ["analytics"] });
  };

  const issue = useMutation({
    mutationFn: (id: string) => api.patch(`/bookings/${id}/issue`),
    onSuccess: () => {
      toast.success("Asset issued");
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
  const ret = useMutation({
    mutationFn: (id: string) => api.patch(`/bookings/${id}/return`),
    onSuccess: () => {
      toast.success("Return recorded");
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div>
      <PageHeader
        title="Resource Allocations"
        subtitle="Issue approved bookings and record returns."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              tab === t.value
                ? "bg-brand-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : data && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((b) => {
            const due = daysUntil(b.dueDate);
            return (
              <Card key={b.id} className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800">{b.asset?.name}</h3>
                    <BookingStatusBadge status={b.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {b.user?.name} · Qty {b.quantity} · {formatDate(b.startDate)} →{" "}
                    {formatDate(b.endDate)}
                  </p>
                  {(b.status === "ISSUED" || b.status === "OVERDUE") && due !== null && (
                    <p
                      className={`mt-1 text-sm font-medium ${
                        due < 0 ? "text-rose-600" : "text-slate-500"
                      }`}
                    >
                      {due < 0 ? `Overdue by ${Math.abs(due)} day(s)` : `Due in ${due} day(s)`}
                    </p>
                  )}
                </div>
                <div>
                  {b.status === "APPROVED" ? (
                    <Button
                      size="sm"
                      loading={issue.isPending && issue.variables === b.id}
                      onClick={() => issue.mutate(b.id)}
                      icon={<ArrowRightLeft className="h-4 w-4" />}
                    >
                      Issue asset
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="success"
                      loading={ret.isPending && ret.variables === b.id}
                      onClick={() => ret.mutate(b.id)}
                      icon={<Undo2 className="h-4 w-4" />}
                    >
                      Record return
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<PackageCheck className="h-7 w-7" />}
          title="Nothing here"
          description="No allocations in this state right now."
        />
      )}
    </div>
  );
}
