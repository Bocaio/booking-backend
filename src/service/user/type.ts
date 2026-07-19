export interface User {
  id: string;
  name: string;
  roleId: number;
  roleName: string;
  roleLabel: string;
}

export interface IUserService {
  create: (name: string, roleId: number) => Promise<void>;
  delete: (userId: string) => Promise<void>;
  getAll: () => Promise<User[]>;
  changeRole: (userId: string, roleId: number) => Promise<void>;
}
