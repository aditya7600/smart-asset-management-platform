import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { api } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Spinner, EmptyState } from "../../components/ui/States";
import { Pagination } from "../../components/ui/Pagination";
import { formatDateTime, titleCase } from "../../lib/format";
import type { AuditLog, Pagination as PaginationType } from "../../types";

// Colour-code by the verb at the end of the action key.
function actionTone(action: string): string {
  if (action.includes("DELETE")) return "bg-rose-100 text-rose-700";
  if (action.includes("CREATE") || action.includes("REGISTER")) return "bg-emerald-100 text-emerald-700";
  if (action.includes("APPROVE") || action.includes("ISSUE")) return "bg-blue-100 text-blue-700";
  if (action.includes("REJECT")) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

export default function AuditLogs() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["audit", page],
    queryFn: async () =>
      (await api.get<{ logs: AuditLog[]; pagination: PaginationType }>(`/audit?page=${page}`)).data,
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="A complete, tamper-evident trail of system activity."
      />

      <Card className="overflow-hidden">
        {isLoading ? (
          <Spinner />
        ) : data && data.logs.length > 0 ? (
          <>
            <div className="divide-y divide-slate-50">
              {data.logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                  <Badge className={`${actionTone(log.action)} mt-0.5`}>
                    {titleCase(log.action)}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700">
                      {log.details || `${titleCase(log.action)} on ${log.entityType}`}
                    </p>
                    <p className="text-xs text-slate-400">
                      {log.user?.name || log.actorName || "System"} · {log.entityType} ·{" "}
                      {formatDateTime(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4">
              <Pagination pagination={data.pagination} onChange={setPage} />
            </div>
          </>
        ) : (
          <EmptyState
            icon={<ScrollText className="h-7 w-7" />}
            title="No activity yet"
            description="System actions will be recorded here."
          />
        )}
      </Card>
    </div>
  );
}
