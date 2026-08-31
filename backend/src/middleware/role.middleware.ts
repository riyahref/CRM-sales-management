import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../lib/errors.js";

export function requireManager(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== "manager") {
    return next(new ForbiddenError("Manager access required."));
  }
  next();
}
