import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { notFoundHandler, errorHandler } from "./middleware/error.js";

import authRoutes from "./modules/auth/auth.routes.js";
import categoryRoutes from "./modules/category/category.routes.js";
import assetRoutes from "./modules/asset/asset.routes.js";
import bookingRoutes from "./modules/booking/booking.routes.js";
import analyticsRoutes from "./modules/analytics/analytics.routes.js";
import notificationRoutes from "./modules/notification/notification.routes.js";
import auditRoutes from "./modules/audit/audit.routes.js";
import maintenanceRoutes from "./modules/maintenance/maintenance.routes.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  if (env.nodeEnv !== "test") {
    app.use(morgan(env.isProduction ? "combined" : "dev"));
  }

  // Health check.
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "assetflow-api", time: new Date().toISOString() });
  });

  // Feature routes.
  app.use("/api/auth", authRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/assets", assetRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/audit", auditRoutes);
  app.use("/api/maintenance", maintenanceRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
