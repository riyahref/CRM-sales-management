import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/express.js";
import { opportunityService } from "../services/opportunity.service.js";
import {
  opportunityQuerySchema,
  stageTransitionSchema
} from "../validation/opportunity.validation.js";

export class OpportunityController {
  public async getOpportunities(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = opportunityQuerySchema.parse(req.query);
      const result = await opportunityService.getOpportunities(req.user!, query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async getOpportunityById(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await opportunityService.getOpportunityById(req.user!, id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async transitionStage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const input = stageTransitionSchema.parse(req.body);
      const result = await opportunityService.transitionStage(req.user!, id, input);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const opportunityController = new OpportunityController();
