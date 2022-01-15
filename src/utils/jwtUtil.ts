import * as jwt from "jsonwebtoken";
import { Role } from "../types/Role";

export function generateAccessToken(name: string, role: Role): string {
  return jwt.sign(
    {
      name,
      sub: role,
      exp: Math.floor(new Date().getTime() / 1000) + 2 * 60 * 60,
    },
    process.env.JWT_SECRET,
    { algorithm: "HS256" }
  ) as string;
}

export function generateRefreshToken(name: string, role: Role): string {
  return jwt.sign(
    {
      name,
      sub: role,
      exp: Math.floor(new Date().getTime() / 1000) + 7 * 60 * 60 * 24,
    },
    process.env.REFRESH_SECRET,
    { algorithm: "HS256" }
  );
}
