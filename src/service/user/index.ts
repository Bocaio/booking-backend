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

  create = async (name: string, role_id: number): Promise<void> => {
    const role = await this.roleRepository.getById(role_id);
    if (!role) {
      throw new AppError(404, ErrorMessage.ROLE_NOT_FOUND);
    }

    await this.userRepository.create(uuidv7(), name, role_id);
  };

  delete = async (user_id: string): Promise<void> => {
    const deleted = await this.userRepository.delete(user_id);
    if (deleted === 0) {
      throw new AppError(404, ErrorMessage.USER_NOT_FOUND);
    }
  };

  getAll = async (): Promise<User[]> => {
    return this.userRepository.getAll();
  };

  changeRole = async (user_id: string, role_id: number): Promise<void> => {
    const role = await this.roleRepository.getById(role_id);
    if (!role) {
      throw new AppError(404, ErrorMessage.ROLE_NOT_FOUND);
    }

    const updated = await this.userRepository.updateRole(user_id, role_id);
    if (updated === 0) {
      throw new AppError(404, ErrorMessage.USER_NOT_FOUND);
    }
  };
}
