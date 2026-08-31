import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller.js";
import { authenticate } from "../middleware/authenticate.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/summary", (req, res, next) => {
  dashboardController.getSummary(req, res, next);
});

export default router;
