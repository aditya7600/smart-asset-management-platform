import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Wrench, CheckCircle2 } from "lucide-react";
import { api, getErrorMessage } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Field, Select } from "../../components/ui/Field";
import { Spinner, EmptyState } from "../../components/ui/States";
import { formatDate, titleCase } from "../../lib/format";
import type { MaintenanceRecord, MaintenanceStatus } from "../../types";

const statusStyle: Record<MaintenanceStatus, string> = {
  OPEN: "bg-rose-100 text-rose-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
};

export default function Maintenance() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<MaintenanceRecord | null>(null);
  const [status, setStatus] = useState<MaintenanceStatus>("IN_PROGRESS");
  const [restore, setRestore] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ["maintenance"],
    queryFn: async () =>
      (await api.get<{ records: MaintenanceRecord[] }>("/maintenance")).data.records,
  });

  const update = useMutation({
    mutationFn: () =>
      api.patch(`/maintenance/${editing!.id}`, {
        status,
        restoreAsset: status === "RESOLVED" ? restore : false,
        condition: status === "RESOLVED" && restore ? "GOOD" : undefined,
      }),
    onSuccess: () => {
      toast.success("Record updated");
      qc.invalidateQueries({ queryKey: ["maintenance"] });
      qc.invalidateQueries({ queryKey: ["assets"] });
      setEditing(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const open = (r: MaintenanceRecord) => {
    setEditing(r);
    setStatus(r.status === "OPEN" ? "IN_PROGRESS" : r.status);
    setRestore(true);
  };

  return (
    <div>
      <PageHeader
        title="Asset Health"
        subtitle="Track maintenance, repairs and damage reports across the inventory."
      />

      {isLoading ? (
        <Spinner />
      ) : data && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((r) => (
            <Card key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-800">{r.asset?.name}</h3>
                    <Badge className="bg-slate-100 text-slate-600">{titleCase(r.type)}</Badge>
                    <Badge className={statusStyle[r.status]}>{titleCase(r.status)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{r.description}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Reported {formatDate(r.createdAt)}
                    {r.reportedBy ? ` by ${r.reportedBy.name}` : ""}
                  </p>
                </div>
              </div>
              {r.status !== "RESOLVED" && (
                <Button size="sm" variant="secondary" onClick={() => open(r)}>
                  Update
                </Button>
              )}
              {r.status === "RESOLVED" && (
                <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> Resolved
                </span>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Wrench className="h-7 w-7" />}
          title="No maintenance records"
          description="Damage reports and maintenance logs will appear here."
        />
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Update Maintenance Record"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button loading={update.isPending} onClick={() => update.mutate()}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as MaintenanceStatus)}>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </Select>
          </Field>
          {status === "RESOLVED" && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={restore}
                onChange={(e) => setRestore(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-300"
              />
              Return asset to <strong>Available / Good</strong> condition
            </label>
          )}
        </div>
      </Modal>
    </div>
  );
}
