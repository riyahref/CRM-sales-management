import { Router } from "express";
import { userController } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/authenticate.middleware.js";
import { requireManager } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", requireManager, (req, res, next) => {
  userController.getUsers(req, res, next);
});

router.patch("/:id", requireManager, (req, res, next) => {
  userController.updateUserStatus(req, res, next);
});

export default router;
