require("dotenv").config();
import { AuthChecker } from "type-graphql";
import type { ContextType } from "../types/ContextType";
import * as jwt from "jsonwebtoken";
import { Role } from "../types/Role";

export const authCheck: AuthChecker<ContextType> = ({ context }, roles) => {
  const { payload } = context;
  if (!payload) {
    return false;
  }

  const { token } = payload;

  try {
    const decoded = jwt.decode(token);
    if (!decoded.sub) {
      return false;
    }

    if (
      !(decoded as jwt.JwtPayload).exp ||
      (decoded as jwt.JwtPayload).exp < Math.floor(new Date().getTime() / 1000)
    ) {
      return false;
    }

    const sub = (decoded.sub as string).toUpperCase();

    if (!(Object.values(Role) as string[]).includes(sub)) {
      return false;
    }

    if (roles.length == 0) {
      return true;
    }
    return roles.includes(sub);
  } catch (e) {
    return false;
  }
};
