import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { signToken } from "../../lib/jwt.js";
import { ApiError } from "../../utils/ApiError.js";
import { Role } from "../../utils/constants.js";
import { recordAudit } from "../../services/audit.service.js";
import type { RegisterInput, LoginInput } from "./auth.schema.js";

function publicUser(user: { id: string; name: string; email: string; role: string }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body as RegisterInput;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  // Self-registration always creates a standard USER. Admins are seeded.
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: Role.USER },
  });

  await recordAudit({
    userId: user.id,
    actorName: user.name,
    action: "USER_REGISTERED",
    entityType: "User",
    entityId: user.id,
    details: `New user registered: ${user.email}`,
  });

  const token = signToken({ sub: user.id, role: user.role, email: user.email });
  res.status(201).json({ token, user: publicUser(user) });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as LoginInput;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const token = signToken({ sub: user.id, role: user.role, email: user.email });
  res.json({ token, user: publicUser(user) });
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw ApiError.notFound("User not found");
  res.json({ user: publicUser(user) });
}
