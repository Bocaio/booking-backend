import { v7 as uuidv7 } from "uuid";
import { IUserRepository } from "../../repository/mysql/user.js";
import { IRoleRepository } from "../../repository/mysql/role.js";
import { AppError } from "../../types/AppError.js";
import { ErrorMessage } from "../../constants/message.js";
import { IUserService, User } from "./type.js";

export class UserService implements IUserService {
  private readonly userRepository: IUserRepository;
  private readonly roleRepository: IRoleRepository;

  constructor(
    userRepository: IUserRepository,
    roleRepository: IRoleRepository,
  ) {
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
  }

  create = async (name: string, roleId: number): Promise<void> => {
    const role = await this.roleRepository.getById(roleId);
    if (!role) {
      throw new AppError(404, ErrorMessage.ROLE_NOT_FOUND);
    }

    await this.userRepository.create(uuidv7(), name, roleId);
  };

  delete = async (userId: string, deleteUserId: string): Promise<void> => {
    if (userId === deleteUserId) {
      throw new AppError(400, ErrorMessage.DELETE_SELF);
    }
    const deleted = await this.userRepository.delete(deleteUserId);
    if (deleted === 0) {
      throw new AppError(404, ErrorMessage.USER_NOT_FOUND);
    }
  };

  getAll = async (): Promise<User[]> => {
    return this.userRepository.getAll();
  };

  changeRole = async (userId: string, roleId: number): Promise<void> => {
    const role = await this.roleRepository.getById(roleId);
    if (!role) {
      throw new AppError(404, ErrorMessage.ROLE_NOT_FOUND);
    }

    const updated = await this.userRepository.updateRole(userId, roleId);
    if (updated === 0) {
      throw new AppError(404, ErrorMessage.USER_NOT_FOUND);
    }
  };
}
