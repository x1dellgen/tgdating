import type { Request, Response, NextFunction } from "express";
import { type ZodSchema, ZodError } from "zod";

/**
 * Middleware-обёртка для валидации req.body, req.query, req.params
 * с помощью Zod-схемы.
 *
 * Использование:
 *   router.post("/path", validate(schema), handler);
 *
 * Где schema — объект вида { body?, query?, params? } с Zod-схемами.
 */
export function validate(schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query) as typeof req.query;
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params) as typeof req.params;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formatted = error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }));
        res.status(400).json({
          error: "Ошибка валидации",
          details: formatted,
        });
        return;
      }
      next(error);
    }
  };
}
