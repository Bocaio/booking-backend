import { IRoleRepository } from "../../repository/mysql/role.js";
import { IPermissionRepository } from "../../repository/mysql/permission.js";
import { Role, RoleWithPermissions } from "../../types/index.js";
import { AppError } from "../../types/AppError.js";
import { ErrorMessage } from "../../constants/message.js";
import { IRoleService } from "./type.js";

const ADMIN_ROLE_NAME = "admin";

export class RoleService implements IRoleService {
  private readonly roleRepository: IRoleRepository;
  private readonly permissionRepository: IPermissionRepository;

  constructor(
    roleRepository: IRoleRepository,
    permissionRepository: IPermissionRepository,
  ) {
    this.roleRepository = roleRepository;
    this.permissionRepository = permissionRepository;
  }

  getAll = async (): Promise<Role[]> => {
    return this.roleRepository.getAll();
  };

  getAllWithPermission = async (): Promise<RoleWithPermissions[]> => {
    const rows = await this.roleRepository.getAllWithPermissions();

    const rolesMap = new Map<number, RoleWithPermissions>();
    for (const row of rows) {
      let role = rolesMap.get(row.roleId);
      if (!role) {
        role = {
          id: row.roleId,
          name: row.roleName,
          label: row.roleLabel,
          permissions: [],
        };
        rolesMap.set(row.roleId, role);
      }
      if (row.permissionId !== null) {
        role.permissions.push({
          id: row.permissionId,
          code: row.permissionCode as string,
          description: row.permissionDescription,
        });
      }
    }
    return Array.from(rolesMap.values());
  };

  addPermission = async (
    roleId: number,
    permissionId: number,
  ): Promise<void> => {
    const role = await this.roleRepository.getById(roleId);
    if (!role) {
      throw new AppError(404, ErrorMessage.ROLE_NOT_FOUND);
    }
    this.ensureNotAdminRole(role);

    const permission = await this.permissionRepository.getById(permissionId);
    if (!permission) {
      throw new AppError(404, ErrorMessage.PERMISSION_NOT_FOUND);
    }

    await this.roleRepository.addPermission(roleId, permissionId);
  };

  deletePermission = async (
    roleId: number,
    permissionId: number,
  ): Promise<void> => {
    const role = await this.roleRepository.getById(roleId);
    if (!role) {
      throw new AppError(404, ErrorMessage.ROLE_NOT_FOUND);
    }
    this.ensureNotAdminRole(role);

    const permission = await this.permissionRepository.getById(permissionId);
    if (!permission) {
      throw new AppError(404, ErrorMessage.PERMISSION_NOT_FOUND);
    }

    await this.roleRepository.deletePermission(roleId, permissionId);
  };

  private ensureNotAdminRole = (role: Role): void => {
    if (role.name === ADMIN_ROLE_NAME) {
      throw new AppError(400, ErrorMessage.ADMIN_ROLE_LOCKED);
    }
  };
}
