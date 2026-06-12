import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Search, Boxes, QrCode } from "lucide-react";
import { api, getErrorMessage } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { Spinner, EmptyState } from "../../components/ui/States";
import { Pagination } from "../../components/ui/Pagination";
import { AssetStatusBadge, ConditionBadge } from "../../components/StatusBadge";
import { AssetFormModal } from "../../components/AssetFormModal";
import type { Asset, Category, Pagination as PaginationType } from "../../types";

export default function Inventory() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [deleting, setDeleting] = useState<Asset | null>(null);
  const [qrFor, setQrFor] = useState<Asset | null>(null);

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get<{ categories: Category[] }>("/categories")).data.categories,
  });

  const assets = useQuery({
    queryKey: ["assets", "admin", { search, categoryId, page }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: "10" });
      if (search) params.set("search", search);
      if (categoryId) params.set("categoryId", categoryId);
      return (
        await api.get<{ assets: Asset[]; pagination: PaginationType }>(`/assets?${params}`)
      ).data;
    },
    placeholderData: keepPreviousData,
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/assets/${id}`),
    onSuccess: () => {
      toast.success("Asset deleted");
      qc.invalidateQueries({ queryKey: ["assets"] });
      setDeleting(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const qr = useQuery({
    queryKey: ["asset-qr", qrFor?.id],
    queryFn: async () => (await api.get<{ qr: string }>(`/assets/${qrFor!.id}/qr`)).data.qr,
    enabled: !!qrFor,
  });

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (a: Asset) => {
    setEditing(a);
    setFormOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Inventory Management"
        subtitle="Add, edit and organize your asset catalog."
        action={
          <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>
            Add asset
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search assets…"
            className="input pl-9"
          />
        </div>
        <Select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(1);
          }}
          className="sm:w-56"
        >
          <option value="">All categories</option>
          {categories.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <Card className="overflow-hidden">
        {assets.isLoading ? (
          <Spinner label="Loading inventory…" />
        ) : assets.data && assets.data.assets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Asset</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Available</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Condition</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {assets.data.assets.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{a.name}</div>
                      <div className="text-xs text-slate-400">{a.location ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{a.category?.name}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-700">{a.availableQuantity}</span>
                      <span className="text-slate-400"> / {a.totalQuantity}</span>
                    </td>
                    <td className="px-4 py-3">
                      <AssetStatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-3">
                      <ConditionBadge condition={a.condition} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <IconBtn title="QR code" onClick={() => setQrFor(a)}>
                          <QrCode className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn title="Edit" onClick={() => openEdit(a)}>
                          <Pencil className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn title="Delete" danger onClick={() => setDeleting(a)}>
                          <Trash2 className="h-4 w-4" />
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4">
              <Pagination pagination={assets.data.pagination} onChange={setPage} />
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<Boxes className="h-7 w-7" />}
            title="No assets yet"
            description="Add your first asset to start building the inventory."
            action={
              <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>
                Add asset
              </Button>
            }
          />
        )}
      </Card>

      <AssetFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        categories={categories.data ?? []}
        asset={editing}
      />

      {/* Delete confirmation */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete asset"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={del.isPending} onClick={() => del.mutate(deleting!.id)}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete <strong>{deleting?.name}</strong>? This also removes its
          booking and maintenance history and cannot be undone.
        </p>
      </Modal>

      {/* QR modal */}
      <Modal open={!!qrFor} onClose={() => setQrFor(null)} title={`QR · ${qrFor?.name ?? ""}`} size="sm">
        <div className="flex flex-col items-center gap-3 py-2">
          {qr.isLoading ? (
            <Spinner />
          ) : (
            <img src={qr.data} alt="QR" className="h-56 w-56 rounded-lg border border-slate-200" />
          )}
          <p className="text-center text-sm text-slate-500">
            Print and attach to the physical asset for quick scanning.
          </p>
        </div>
      </Modal>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`rounded-lg p-2 transition ${
        danger
          ? "text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}
