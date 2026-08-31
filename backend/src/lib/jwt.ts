import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { AuthUser } from "../types/express.js";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable must be set in production mode.");
}

const JWT_SECRET = process.env.JWT_SECRET || "fallback_crm_jwt_secret_dev_only";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

export interface JwtPayloadData {
  id: number;
  email: string;
  role: Role;
}

export function signToken(payload: JwtPayloadData): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });
}

export function verifyToken(token: string): AuthUser {
  const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
  return {
    id: decoded.id as number,
    email: decoded.email as string,
    role: decoded.role as Role
  };
}
