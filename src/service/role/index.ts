import { IRoleRepository } from "../../repository/mysql/role.js";
import { Role } from "../../types/index.js";
import { IRoleService } from "./type.js";

export class RoleService implements IRoleService {
  private readonly roleRepository: IRoleRepository;

  constructor(roleRepository: IRoleRepository) {
    this.roleRepository = roleRepository;
  }

  getAll = async (): Promise<Role[]> => {
    return this.roleRepository.getAll();
  };
}
