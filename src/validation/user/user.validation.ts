import z from "zod";
import { ValidateBody } from "../index.js";

const createUserSchema = z.object({
  name: z.string().min(1, "name is required").max(255, "name is too long"),
  roleId: z.coerce.number().int().positive(),
});

const deleteUserSchema = z.object({
  id: z.uuid(),
});

const changeRoleSchema = z.object({
  userId: z.uuid(),
  roleId: z.coerce.number().int().positive(),
});

export const validateCreateUser = ValidateBody(createUserSchema);
export const validateDeleteUser = ValidateBody(deleteUserSchema);
export const validateChangeRole = ValidateBody(changeRoleSchema);
