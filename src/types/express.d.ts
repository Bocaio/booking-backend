import { AuthedUser } from "./AuthedUser.ts";

declare global {
  namespace Express {
    interface Request {
      user?: AuthedUser;
      validateQuery?: Record<string, string>;
    }
  }
}
