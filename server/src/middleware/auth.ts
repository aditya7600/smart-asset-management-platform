import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt.js";
import { ApiError } from "../utils/ApiError.js";
import { Role } from "../utils/constants.js";

// Augment Express Request with the authenticated user.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: string; email: string };
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    return header.slice(7);
  }
  if (req.cookies?.token) {
    return req.cookies.token as string;
  }
  return null;
}

// Requires a valid JWT. Populates req.user.
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    throw ApiError.unauthorized("Authentication token missing");
  }
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch {
    throw ApiError.unauthorized("Invalid or expired token");
  }
}

// Requires the authenticated user to be an administrator.
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) throw ApiError.unauthorized();
  if (req.user.role !== Role.ADMIN) {
    throw ApiError.forbidden("Administrator access required");
  }
  next();
}
