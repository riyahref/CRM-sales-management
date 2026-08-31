import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "../lib/errors.js";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    const responseBody: Record<string, unknown> = {
      error: err.errorCode,
      message: err.message
    };
    if (err.fields && err.fields.length > 0) {
      responseBody.fields = err.fields;
    }
    res.status(err.statusCode).json(responseBody);
    return;
  }

  if (err instanceof ZodError) {
    const fields = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message
    }));

    res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "One or more fields are invalid.",
      fields
    });
    return;
  }

  console.error("Unhandled Error:", err);
  res.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    message: "An unexpected internal server error occurred."
  });
}
