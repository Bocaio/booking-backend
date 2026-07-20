import { IPermissionRepository } from "../../repository/mysql/permission.js";
import { Permission } from "../../types/index.js";
import { IPermissionService } from "./type.js";

export class PermissionService implements IPermissionService {
  private readonly permissionRepository: IPermissionRepository;

  constructor(permissionRepository: IPermissionRepository) {
    this.permissionRepository = permissionRepository;
  }

  getAll = async (): Promise<Permission[]> => {
    return this.permissionRepository.getAll();
  };
}
