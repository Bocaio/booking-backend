import { Router } from "express";
import { authController } from "../dependency-injection/controllers.js";
import { validateLogin } from "../validation/auth/auth.validation.js";

const router = Router();

router.get("/login/roster", authController.getRoster);
router.post("/login", validateLogin, authController.login);
router.post("/login/refresh", authController.refresh);

export { router as authRouter };
