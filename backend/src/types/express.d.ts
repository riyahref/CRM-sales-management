import { Request } from "express";
import { Role } from "@prisma/client";

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
