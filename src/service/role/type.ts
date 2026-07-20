import { Role, RoleWithPermissions } from "../../types/index.js";

export interface IRoleService {
  getAll: () => Promise<Role[]>;
  getAllWithPermission: () => Promise<RoleWithPermissions[]>;
  addPermission: (roleId: number, permissionId: number) => Promise<void>;
  deletePermission: (roleId: number, permissionId: number) => Promise<void>;
}
