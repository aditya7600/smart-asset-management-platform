import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Boxes,
  CalendarCheck,
  ClipboardList,
  PackageCheck,
  Tags,
  ScrollText,
  Wrench,
  LogOut,
  Menu,
  X,
  PackageSearch,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { NotificationBell } from "./NotificationBell";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: true },
  { to: "/catalog", label: "Browse Assets", icon: PackageSearch },
  { to: "/my-bookings", label: "My Bookings", icon: CalendarCheck },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes, adminOnly: true },
  { to: "/admin/categories", label: "Categories", icon: Tags, adminOnly: true },
  { to: "/admin/requests", label: "Requests", icon: ClipboardList, adminOnly: true },
  { to: "/admin/allocations", label: "Allocations", icon: PackageCheck, adminOnly: true },
  { to: "/admin/maintenance", label: "Asset Health", icon: Wrench, adminOnly: true },
  { to: "/admin/audit", label: "Audit Logs", icon: ScrollText, adminOnly: true },
];

export function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = navItems.filter((i) => !i.adminOnly || isAdmin);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-2.5 px-6 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
          <Boxes className="h-5 w-5" />
        </div>
        <div>
          <p className="text-base font-bold leading-tight text-slate-800">AssetFlow</p>
          <p className="text-[11px] leading-tight text-slate-400">Resource Management</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              }`
            }
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut className="h-[18px] w-[18px]" /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed hidden h-screen w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-white shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur lg:px-8">
          <button
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-tight text-slate-700">{user?.name}</p>
                <p className="text-[11px] capitalize leading-tight text-slate-400">
                  {user?.role.toLowerCase()}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
