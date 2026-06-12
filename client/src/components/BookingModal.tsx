import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "../lib/api";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Field, Input, Textarea } from "./ui/Field";
import type { Asset } from "../types";

// Returns today's date as YYYY-MM-DD for date-input minimums.
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function BookingModal({
  asset,
  open,
  onClose,
}: {
  asset: Asset;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [purpose, setPurpose] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      api.post("/bookings", {
        assetId: asset.id,
        quantity,
        startDate,
        endDate,
        purpose,
      }),
    onSuccess: () => {
      toast.success("Booking request submitted!");
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["assets"] });
      onClose();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const max = asset.availableQuantity;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Request: ${asset.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={max < 1}
          >
            Submit request
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <span className="font-medium text-emerald-600">{max}</span> unit{max === 1 ? "" : "s"}{" "}
          available · {asset.category?.name}
        </div>

        <Field label="Quantity" hint={`Maximum ${max} available`}>
          <Input
            type="number"
            min={1}
            max={max}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(max, Number(e.target.value))))}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date">
            <Input
              type="date"
              min={todayISO()}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate < e.target.value) setEndDate(e.target.value);
              }}
            />
          </Field>
          <Field label="End date">
            <Input
              type="date"
              min={startDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Purpose" hint="Tell the admin what you need it for.">
          <Textarea
            rows={3}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g. Photography for the cultural fest opening ceremony"
          />
        </Field>
      </div>
    </Modal>
  );
}
