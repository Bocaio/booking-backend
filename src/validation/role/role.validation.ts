import z from "zod";
import { ValidateBody } from "../index.js";

const rolePermissionSchema = z.object({
  roleId: z.coerce.number().int().positive(),
  permissionId: z.coerce.number().int().positive(),
});

export const validateAddPerm = ValidateBody(rolePermissionSchema);
export const validateDeletePerm = ValidateBody(rolePermissionSchema);
