import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "brand" | "emerald" | "amber" | "rose" | "violet" | "blue";
  hint?: string;
}

const tones: Record<NonNullable<StatCardProps["tone"]>, string> = {
  brand: "bg-brand-50 text-brand-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  violet: "bg-violet-50 text-violet-600",
  blue: "bg-blue-50 text-blue-600",
};

export function StatCard({ label, value, icon: Icon, tone = "brand", hint }: StatCardProps) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-tight text-slate-800">{value}</p>
        <p className="truncate text-sm text-slate-500">{label}</p>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}
