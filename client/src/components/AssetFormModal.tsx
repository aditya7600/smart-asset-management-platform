import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "../lib/api";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Field, Input, Textarea, Select } from "./ui/Field";
import type { Asset, Category } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  asset?: Asset | null; // present => edit mode
}

const STATUSES = ["AVAILABLE", "UNAVAILABLE", "MAINTENANCE", "RETIRED"];
const CONDITIONS = ["EXCELLENT", "GOOD", "FAIR", "POOR", "DAMAGED"];

export function AssetFormModal({ open, onClose, categories, asset }: Props) {
  const qc = useQueryClient();
  const isEdit = !!asset;

  const [form, setForm] = useState({
    name: "",
    description: "",
    categoryId: "",
    totalQuantity: 1,
    status: "AVAILABLE",
    condition: "GOOD",
    location: "",
    imageUrl: "",
  });

  useEffect(() => {
    if (asset) {
      setForm({
        name: asset.name,
        description: asset.description ?? "",
        categoryId: asset.categoryId,
        totalQuantity: asset.totalQuantity,
        status: asset.status,
        condition: asset.condition,
        location: asset.location ?? "",
        imageUrl: asset.imageUrl ?? "",
      });
    } else {
      setForm({
        name: "",
        description: "",
        categoryId: categories[0]?.id ?? "",
        totalQuantity: 1,
        status: "AVAILABLE",
        condition: "GOOD",
        location: "",
        imageUrl: "",
      });
    }
  }, [asset, categories, open]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { ...form };
      return isEdit ? api.put(`/assets/${asset!.id}`, payload) : api.post("/assets", payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Asset updated" : "Asset created");
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      onClose();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? "Edit Asset" : "Add New Asset"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={mutation.isPending}
            disabled={!form.name || !form.categoryId}
            onClick={() => mutation.mutate()}
          >
            {isEdit ? "Save changes" : "Create asset"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Asset name">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Canon EOS 90D DSLR" />
          </Field>
        </div>
        <Field label="Category">
          <Select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            {categories.length === 0 && <option value="">Create a category first</option>}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Total quantity" hint={isEdit ? "Cannot drop below reserved units." : undefined}>
          <Input
            type="number"
            min={1}
            value={form.totalQuantity}
            onChange={(e) => set("totalQuantity", Number(e.target.value))}
          />
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Condition">
          <Select value={form.condition} onChange={(e) => set("condition", e.target.value)}>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Location">
          <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Media Room A" />
        </Field>
        <Field label="Image URL (optional)">
          <Input value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://…" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Short description of the asset…"
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
