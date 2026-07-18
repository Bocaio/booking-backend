import JWT from "jsonwebtoken";
import { IAuthService, LoginReturn, Roster } from "./type.js";
import { IUserRepository, User } from "../../repository/mysql/user.js";
import { IRefreshTokenRepository } from "../../repository/redis/refresh-token.js";
import { UserPayload } from "../../types/JwtPayload.js";
import { CONFIGS } from "../../config/index.js";
import { AppError } from "../../types/AppError.js";
import { ErrorMessage } from "../../constants/message.js";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "7d";

export class AuthService implements IAuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  getRoster = async (): Promise<Roster[]> => {
    const users = await this.userRepository.getAll();
    return users.map((user) => this.toRoster(user));
  };

  login = async (id: string): Promise<LoginReturn> => {
    const user = await this.userRepository.getById(id);
    if (!user) {
      throw new AppError(404, ErrorMessage.USER_NOT_FOUND);
    }

    const accessToken = this.signToken(user.id, ACCESS_TOKEN_TTL);
    const refreshToken = this.signToken(user.id, REFRESH_TOKEN_TTL);

    await this.refreshTokenRepository.set(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: this.toRoster(user),
    };
  };

  refresh = async (token: string): Promise<LoginReturn> => {
    const payload = JWT.verify(token, CONFIGS.JWT_SECRET_KEY) as UserPayload;
    const { userId } = payload;
    const isValid = await this.refreshTokenRepository.isMember(userId, token);
    if (!isValid) throw new AppError(401, ErrorMessage.UNAUTHORIZED);

    const user = await this.userRepository.getById(payload.userId);
    if (!user) {
      await this.refreshTokenRepository.delete(payload.userId, token);
      throw new AppError(401, ErrorMessage.UNAUTHORIZED);
    }

    const newAccessToken = this.signToken(user.id, ACCESS_TOKEN_TTL);
    const newRefreshToken = this.signToken(user.id, REFRESH_TOKEN_TTL);

    await this.refreshTokenRepository.delete(payload.userId, token);
    await this.refreshTokenRepository.set(payload.userId, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: this.toRoster(user),
    };
  };

  private signToken(userId: string, expiresIn: "15m" | "7d"): string {
    const payload: UserPayload = { userId };
    return JWT.sign(payload, CONFIGS.JWT_SECRET_KEY, { expiresIn });
  }

  private toRoster(user: User): Roster {
    return {
      id: user.id,
      name: user.name,
      label: user.role_label,
    };
  }
}
