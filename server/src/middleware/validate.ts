import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodSchema } from "zod";
import { ApiError } from "../utils/ApiError.js";

type Part = "body" | "query" | "params";

// Validates a request part against a Zod schema and replaces it with parsed data.
export function validate(schema: ZodSchema, part: Part = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[part]);
      // query/params are read-only getters in Express 5; assign defensively.
      (req as unknown as Record<string, unknown>)[part] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
        throw ApiError.badRequest("Validation failed", details);
      }
      throw err;
    }
  };
}
