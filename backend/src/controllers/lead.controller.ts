import { Request, Response, NextFunction } from "express";
import {
  leadQuerySchema,
  leadIdParamSchema,
  createLeadSchema,
  updateLeadSchema
} from "../validation/lead.validation.js";
import { leadService } from "../services/lead.service.js";

export class LeadController {
  public async getLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = leadQuerySchema.parse(req.query);
      const result = await leadService.getLeads(req.user!, query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async getLeadById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = leadIdParamSchema.parse(req.params);
      const lead = await leadService.getLeadById(req.user!, id);
      res.status(200).json(lead);
    } catch (error) {
      next(error);
    }
  }

  public async createLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createLeadSchema.parse(req.body);
      const lead = await leadService.createLead(req.user!, input);
      res.status(201).json(lead);
    } catch (error) {
      next(error);
    }
  }

  public async updateLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = leadIdParamSchema.parse(req.params);
      const input = updateLeadSchema.parse(req.body);
      const updatedLead = await leadService.updateLead(req.user!, id, input);
      res.status(200).json(updatedLead);
    } catch (error) {
      next(error);
    }
  }

  public async convertLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = leadIdParamSchema.parse(req.params);
      const result = await leadService.convertLead(req.user!, id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const leadController = new LeadController();
