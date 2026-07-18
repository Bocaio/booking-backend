export interface User {
  id: string;
  name: string;
  role_id: number;
  role_name: string;
  role_label: string;
}

export interface IUserService {
  create: (name: string, role_id: number) => Promise<void>;
  delete: (user_id: string) => Promise<void>;
  getAll: () => Promise<User[]>;
  changeRole: (user_id: string, role_id: number) => Promise<void>;
}
