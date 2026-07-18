import { Role } from "../../types/index.js";

export interface IRoleService {
  getAll: () => Promise<Role[]>;
}
