import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { Boxes, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../lib/api";
import { Button } from "../components/ui/Button";
import { Field, Input } from "../components/ui/Field";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) navigate("/", { replace: true });

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(role: "admin" | "user") {
    if (role === "admin") {
      setEmail("admin@assetflow.dev");
      setPassword("admin123");
    } else {
      setEmail("ananya@assetflow.dev");
      setPassword("user123");
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/15">
            <Boxes className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold">AssetFlow</span>
        </div>
        <div>
          <h1 className="text-4xl font-extrabold leading-tight">
            Smart Asset Management & Resource Allocation
          </h1>
          <p className="mt-4 max-w-md text-brand-100">
            Track inventory, manage bookings, run approval workflows, and gain operational
            visibility — all in one centralized platform.
          </p>
        </div>
        <p className="text-sm text-brand-200">Cultural Council · Resource Management Platform</p>
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Sign in</h2>
            <p className="mt-1 text-sm text-slate-500">
              Welcome back. Enter your credentials to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </Field>
            <Button type="submit" loading={loading} className="w-full" icon={<ArrowRight className="h-4 w-4" />}>
              Sign in
            </Button>
          </form>

          <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500">
            <p className="mb-2 font-medium text-slate-600">Demo accounts (click to fill):</p>
            <div className="flex gap-2">
              <button
                onClick={() => fillDemo("admin")}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50"
              >
                Admin
              </button>
              <button
                onClick={() => fillDemo("user")}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50"
              >
                User
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-medium text-brand-600 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
