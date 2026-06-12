import { useQuery } from "@tanstack/react-query";
import {
  Boxes,
  PackageCheck,
  Clock,
  AlertTriangle,
  TrendingUp,
  Layers,
  Users,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { Card, CardHeader, CardBody } from "../components/ui/Card";
import { Spinner, EmptyState } from "../components/ui/States";

interface Overview {
  totalAssets: number;
  totalCategories: number;
  totalUnits: number;
  availableUnits: number;
  inUseUnits: number;
  utilizationRate: number;
  activeBookings: number;
  pendingRequests: number;
  overdueReturns: number;
  issuedCount: number;
  totalUsers: number;
}

const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

export default function Dashboard() {
  const overview = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: async () => (await api.get<Overview>("/analytics/overview")).data,
  });
  const mostUsed = useQuery({
    queryKey: ["analytics", "most-used"],
    queryFn: async () =>
      (await api.get<{ items: { name: string; bookings: number }[] }>("/analytics/most-used")).data
        .items,
  });
  const distribution = useQuery({
    queryKey: ["analytics", "distribution"],
    queryFn: async () =>
      (await api.get<{ items: { name: string; value: number }[] }>(
        "/analytics/category-distribution"
      )).data.items,
  });
  const trend = useQuery({
    queryKey: ["analytics", "trend"],
    queryFn: async () =>
      (await api.get<{ items: { date: string; count: number }[] }>("/analytics/bookings-trend"))
        .data.items,
  });

  if (overview.isLoading) return <Spinner label="Loading dashboard…" />;
  const o = overview.data!;

  return (
    <div>
      <PageHeader
        title="Operations Dashboard"
        subtitle="Real-time visibility into inventory utilization and booking activity."
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Assets" value={o.totalAssets} icon={Boxes} tone="brand" hint={`${o.totalCategories} categories`} />
        <StatCard label="Available Units" value={o.availableUnits} icon={PackageCheck} tone="emerald" hint={`of ${o.totalUnits} total`} />
        <StatCard label="Active Bookings" value={o.activeBookings} icon={Activity} tone="violet" hint={`${o.issuedCount} currently issued`} />
        <StatCard label="Pending Requests" value={o.pendingRequests} icon={Clock} tone="amber" />
        <StatCard label="Overdue Returns" value={o.overdueReturns} icon={AlertTriangle} tone="rose" />
        <StatCard label="Utilization Rate" value={`${o.utilizationRate}%`} icon={TrendingUp} tone="blue" hint={`${o.inUseUnits} units in use`} />
        <StatCard label="Units In Use" value={o.inUseUnits} icon={Layers} tone="violet" />
        <StatCard label="Registered Users" value={o.totalUsers} icon={Users} tone="brand" />
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Most Frequently Booked Assets" subtitle="By number of bookings" />
          <CardBody>
            {mostUsed.data && mostUsed.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mostUsed.data} margin={{ left: -16, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 }}
                  />
                  <Bar dataKey="bookings" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No booking data yet" />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Assets by Category" subtitle="Distribution of inventory" />
          <CardBody>
            {distribution.data && distribution.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distribution.data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={45}
                    paddingAngle={2}
                  >
                    {distribution.data.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No categories yet" />
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader title="Booking Activity" subtitle="New requests over the last 14 days" />
          <CardBody>
            {trend.data && trend.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trend.data} margin={{ left: -16, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickFormatter={(d: string) => d.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 }} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#6366f1" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No recent activity" />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
