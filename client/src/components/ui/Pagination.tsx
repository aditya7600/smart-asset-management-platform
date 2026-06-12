import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Pagination as PaginationType } from "../../types";

export function Pagination({
  pagination,
  onChange,
}: {
  pagination: PaginationType;
  onChange: (page: number) => void;
}) {
  const { page, totalPages, total } = pagination;
  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between px-1 py-3 text-sm text-slate-500">
      <span>
        Page <span className="font-medium text-slate-700">{page}</span> of {totalPages} ·{" "}
        {total} item{total === 1 ? "" : "s"}
      </span>
      <div className="flex gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 transition hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 transition hover:bg-slate-50 disabled:opacity-40"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
