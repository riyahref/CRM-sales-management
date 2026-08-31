import { Router } from "express";
import { leadController } from "../controllers/lead.controller.js";
import { authenticate } from "../middleware/authenticate.middleware.js";
import { requireManager } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", (req, res, next) => {
  leadController.getLeads(req, res, next);
});

router.post("/", requireManager, (req, res, next) => {
  leadController.createLead(req, res, next);
});

router.get("/:id", (req, res, next) => {
  leadController.getLeadById(req, res, next);
});

router.patch("/:id", (req, res, next) => {
  leadController.updateLead(req, res, next);
});

router.post("/:id/convert", (req, res, next) => {
  leadController.convertLead(req, res, next);
});

export default router;
