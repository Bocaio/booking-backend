import z from "zod";
import { ValidateBody } from "../index.js";

const loginSchema = z.object({
  id: z.uuid(),
});

export const validateLogin = ValidateBody(loginSchema);
