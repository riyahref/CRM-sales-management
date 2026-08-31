import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service.js";
import { updateUserStatusSchema } from "../validation/user.validation.js";

export class UserController {
  public async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const users = await userService.getUsers(includeInactive);
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }

  public async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const input = updateUserStatusSchema.parse(req.body);
      const updatedUser = await userService.updateUserStatus(id, input.isActive);
      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
