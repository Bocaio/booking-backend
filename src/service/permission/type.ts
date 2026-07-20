import { Permission } from "../../types/index.js";

export interface IPermissionService {
  getAll: () => Promise<Permission[]>;
}
