import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Catalog from "./pages/Catalog";
import AssetDetail from "./pages/AssetDetail";
import MyBookings from "./pages/MyBookings";
import Inventory from "./pages/admin/Inventory";
import Categories from "./pages/admin/Categories";
import Requests from "./pages/admin/Requests";
import Allocations from "./pages/admin/Allocations";
import Maintenance from "./pages/admin/Maintenance";
import AuditLogs from "./pages/admin/AuditLogs";
import NotFound from "./pages/NotFound";

export default function App() {
  const { isAdmin } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Default landing depends on role */}
        <Route
          path="/"
          element={<Navigate to={isAdmin ? "/dashboard" : "/catalog"} replace />}
        />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/assets/:id" element={<AssetDetail />} />
        <Route path="/my-bookings" element={<MyBookings />} />

        {/* Admin-only */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute adminOnly>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <ProtectedRoute adminOnly>
              <Inventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute adminOnly>
              <Categories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/requests"
          element={
            <ProtectedRoute adminOnly>
              <Requests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/allocations"
          element={
            <ProtectedRoute adminOnly>
              <Allocations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/maintenance"
          element={
            <ProtectedRoute adminOnly>
              <Maintenance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <ProtectedRoute adminOnly>
              <AuditLogs />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
