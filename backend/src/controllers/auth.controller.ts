import { Request, Response, NextFunction } from "express";
import { loginSchema } from "../validation/auth.validation.js";
import { authService } from "../services/auth.service.js";

export class AuthController {
  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = loginSchema.parse(req.body);
      const result = await authService.login(validatedInput.email, validatedInput.password);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public logout(_req: Request, res: Response): void {
    res.status(204).send();
  }
}

export const authController = new AuthController();
