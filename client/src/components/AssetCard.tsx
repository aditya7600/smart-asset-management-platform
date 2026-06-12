import { Link } from "react-router-dom";
import { MapPin, Boxes } from "lucide-react";
import { AssetStatusBadge } from "./StatusBadge";
import { Button } from "./ui/Button";
import type { Asset } from "../types";

export function AssetCard({
  asset,
  onRequest,
}: {
  asset: Asset;
  onRequest: (asset: Asset) => void;
}) {
  const available = asset.availableQuantity > 0 && asset.status === "AVAILABLE";

  return (
    <div className="card group flex flex-col overflow-hidden transition hover:shadow-card-hover">
      <Link to={`/assets/${asset.id}`} className="block">
        <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
          {asset.imageUrl ? (
            <img src={asset.imageUrl} alt={asset.name} className="h-full w-full object-cover" />
          ) : (
            <Boxes className="h-12 w-12 text-slate-300" />
          )}
          <div className="absolute right-2 top-2">
            <AssetStatusBadge status={asset.status} />
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium text-brand-600">{asset.category?.name}</p>
        <Link to={`/assets/${asset.id}`}>
          <h3 className="mt-0.5 line-clamp-1 font-semibold text-slate-800 transition group-hover:text-brand-700">
            {asset.name}
          </h3>
        </Link>
        {asset.description && (
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">{asset.description}</p>
        )}

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {asset.location ?? "—"}
          </span>
          <span>
            <span
              className={`font-semibold ${
                available ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              {asset.availableQuantity}
            </span>{" "}
            / {asset.totalQuantity} available
          </span>
        </div>

        <Button
          size="sm"
          className="mt-3 w-full"
          disabled={!available}
          onClick={() => onRequest(asset)}
        >
          {available ? "Request booking" : "Unavailable"}
        </Button>
      </div>
    </div>
  );
}
