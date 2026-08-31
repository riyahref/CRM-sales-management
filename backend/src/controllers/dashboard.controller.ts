import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/express.js";
import { dashboardService } from "../services/dashboard.service.js";

export class DashboardController {
  public async getSummary(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await dashboardService.getSummary(req.user!);
      res.status(200).json(summary);
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
