import { Router } from "express";
import { customerController } from "../controllers/customer.controller.js";
import { authenticate } from "../middleware/authenticate.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/:id", (req, res, next) => {
  customerController.getCustomerDetail(req, res, next);
});

router.post("/:id/contacts", (req, res, next) => {
  customerController.addContactPerson(req, res, next);
});

router.post("/:id/activities", (req, res, next) => {
  customerController.logActivity(req, res, next);
});

export default router;
