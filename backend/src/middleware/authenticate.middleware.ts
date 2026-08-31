import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt.js";
import { UnauthorizedError } from "../lib/errors.js";

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Your session expired — please log in again."));
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return next(new UnauthorizedError("Your session expired — please log in again."));
  }

  try {
    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (_err) {
    return next(new UnauthorizedError("Your session expired — please log in again."));
  }
}
