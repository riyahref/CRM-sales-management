import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/jwt.js";
import { InvalidCredentialsError, AccountInactiveError } from "../lib/errors.js";
import { Role } from "@prisma/client";

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
}

export interface LoginResult {
  token: string;
  user: UserResponse;
}

export class AuthService {
  public async login(email: string, passwordPlain: string): Promise<LoginResult> {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      throw new InvalidCredentialsError("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) {
      throw new InvalidCredentialsError("Invalid email or password");
    }

    if (!user.isActive) {
      throw new AccountInactiveError("This account is inactive. Contact your administrator.");
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    const userPayload: UserResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    };

    return {
      token,
      user: userPayload
    };
  }
}

export const authService = new AuthService();
