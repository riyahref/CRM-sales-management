import { Router } from "express";
import { opportunityController } from "../controllers/opportunity.controller.js";
import { authenticate } from "../middleware/authenticate.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", (req, res, next) => {
  opportunityController.getOpportunities(req, res, next);
});

router.get("/:id", (req, res, next) => {
  opportunityController.getOpportunityById(req, res, next);
});

router.patch("/:id/stage", (req, res, next) => {
  opportunityController.transitionStage(req, res, next);
});

export default router;
