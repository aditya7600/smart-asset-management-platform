import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";

// 404 handler for unmatched routes.
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Central error handler — converts thrown errors into JSON responses.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // Prisma unique-constraint and known errors surface a clean message.
  const anyErr = err as { code?: string; message?: string };
  if (anyErr?.code === "P2002") {
    res.status(409).json({ error: "A record with this value already exists" });
    return;
  }
  if (anyErr?.code === "P2025") {
    res.status(404).json({ error: "Record not found" });
    return;
  }

  console.error("[error]", err);
  res.status(500).json({ error: "Internal server error" });
}
