import { Router } from "express";
import { authController } from "../dependency-injection/controllers.js";
import { validateLogin } from "../validation/auth/auth.validation.js";
import authMiddleware from "../middlewares/auth.js";

const router = Router();

router.get("/login/roster", authController.getRoster);
router.post("/login", validateLogin, authController.login);
router.post("/login/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/", authMiddleware, authController.me);

export { router as authRouter };
