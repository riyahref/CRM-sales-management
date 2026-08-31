import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/express.js";
import { customerService } from "../services/customer.service.js";
import { contactPersonCreateSchema } from "../validation/customer.validation.js";
import { activityCreateSchema } from "../validation/activity.validation.js";

export class CustomerController {
  public async getCustomerDetail(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await customerService.getCustomerDetail(req.user!, id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async addContactPerson(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const input = contactPersonCreateSchema.parse(req.body);
      const result = await customerService.addContactPerson(req.user!, id, input);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async logActivity(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const input = activityCreateSchema.parse(req.body);
      const result = await customerService.logActivity(req.user!, id, input);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const customerController = new CustomerController();
