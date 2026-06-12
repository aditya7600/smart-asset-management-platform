import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowLeft, MapPin, QrCode, Boxes, Wrench, Calendar } from "lucide-react";
import { api, getErrorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Field, Textarea, Select } from "../components/ui/Field";
import { Spinner, ErrorState } from "../components/ui/States";
import { AssetStatusBadge, ConditionBadge } from "../components/StatusBadge";
import { BookingModal } from "../components/BookingModal";
import { formatDate } from "../lib/format";
import type { Asset } from "../types";

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [bookOpen, setBookOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["asset", id],
    queryFn: async () => (await api.get<{ asset: Asset }>(`/assets/${id}`)).data.asset,
  });

  const qr = useQuery({
    queryKey: ["asset-qr", id],
    queryFn: async () => (await api.get<{ qr: string }>(`/assets/${id}/qr`)).data.qr,
    enabled: qrOpen,
  });

  if (isLoading) return <Spinner label="Loading asset…" />;
  if (isError || !data) return <ErrorState message="Asset not found." />;
  const asset = data;
  const available = asset.availableQuantity > 0 && asset.status === "AVAILABLE";

  return (
    <div>
      <Link
        to="/catalog"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to catalog
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex h-56 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              {asset.imageUrl ? (
                <img src={asset.imageUrl} alt={asset.name} className="h-full w-full object-cover" />
              ) : (
                <Boxes className="h-20 w-20 text-slate-300" />
              )}
            </div>
            <CardBody>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-brand-600">{asset.category?.name}</p>
                  <h1 className="mt-0.5 text-2xl font-bold text-slate-800">{asset.name}</h1>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <AssetStatusBadge status={asset.status} />
                  <ConditionBadge condition={asset.condition} />
                </div>
              </div>

              <p className="mt-4 text-slate-600">{asset.description || "No description provided."}</p>

              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Info label="Available" value={`${asset.availableQuantity} / ${asset.totalQuantity}`} />
                <Info label="Location" value={asset.location ?? "—"} icon={<MapPin className="h-4 w-4" />} />
                <Info label="Added" value={formatDate(asset.createdAt)} />
              </div>
            </CardBody>
          </Card>

          {/* Maintenance history (visible to admins) */}
          {isAdmin && asset.maintenance && asset.maintenance.length > 0 && (
            <Card className="mt-6">
              <CardHeader title="Maintenance & Damage History" />
              <CardBody className="space-y-3">
                {asset.maintenance.map((m) => (
                  <div key={m.id} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                    <Wrench className="mt-0.5 h-4 w-4 text-slate-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">
                        {m.type.replace("_", " ")} ·{" "}
                        <span className="font-normal text-slate-500">{m.status}</span>
                      </p>
                      <p className="text-sm text-slate-600">{m.description}</p>
                      <p className="text-xs text-slate-400">{formatDate(m.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardBody className="space-y-3">
              <Button
                className="w-full"
                disabled={!available}
                onClick={() => setBookOpen(true)}
                icon={<Calendar className="h-4 w-4" />}
              >
                {available ? "Request booking" : "Currently unavailable"}
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setQrOpen(true)}
                icon={<QrCode className="h-4 w-4" />}
              >
                View QR code
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setReportOpen(true)}
                icon={<Wrench className="h-4 w-4" />}
              >
                Report an issue
              </Button>
            </CardBody>
          </Card>

          {isAdmin && asset.bookings && asset.bookings.length > 0 && (
            <Card>
              <CardHeader title="Active Allocations" />
              <CardBody className="space-y-2">
                {asset.bookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{b.user?.name}</span>
                    <span className="text-slate-400">×{b.quantity}</span>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {bookOpen && <BookingModal asset={asset} open={bookOpen} onClose={() => setBookOpen(false)} />}

      {/* QR modal */}
      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="Asset QR Code" size="sm">
        <div className="flex flex-col items-center gap-3 py-2">
          {qr.isLoading ? (
            <Spinner />
          ) : (
            <img src={qr.data} alt="QR code" className="h-56 w-56 rounded-lg border border-slate-200" />
          )}
          <p className="text-center text-sm text-slate-500">
            Scan during issue & return to instantly identify <strong>{asset.name}</strong>.
          </p>
          <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-500">{asset.qrCode}</code>
        </div>
      </Modal>

      <ReportIssueModal
        assetId={asset.id}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onDone={() => qc.invalidateQueries({ queryKey: ["asset", id] })}
      />
    </div>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-0.5 inline-flex items-center gap-1 text-sm font-medium text-slate-700">
        {icon}
        {value}
      </p>
    </div>
  );
}

function ReportIssueModal({
  assetId,
  open,
  onClose,
  onDone,
}: {
  assetId: string;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [type, setType] = useState("DAMAGE_REPORT");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: () => api.post("/maintenance", { assetId, type, description }),
    onSuccess: () => {
      toast.success("Issue reported. Thank you!");
      setDescription("");
      onDone();
      onClose();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Report an Issue"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={mutation.isPending}
            disabled={description.trim().length < 3}
            onClick={() => mutation.mutate()}
          >
            Submit report
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Issue type">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="DAMAGE_REPORT">Damage report</option>
            <option value="MAINTENANCE">Needs maintenance</option>
            <option value="REPAIR">Needs repair</option>
          </Select>
        </Field>
        <Field label="Description">
          <Textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue…"
          />
        </Field>
      </div>
    </Modal>
  );
}
