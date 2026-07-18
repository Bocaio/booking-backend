import { Role, User } from "../../types/index.js";

export type Roster = Pick<User, "id" | "name"> & Pick<Role, "label">;

export interface LoginReturn {
  accessToken: string;
  refreshToken: string;
  user: Roster;
}

export interface IAuthService {
  getRoster: () => Promise<Roster[]>;
  login: (id: string) => Promise<LoginReturn>;
  refresh: (token: string) => Promise<LoginReturn>;
}
