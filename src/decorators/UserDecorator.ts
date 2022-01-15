import { createParamDecorator } from "type-graphql";
import { ContextType } from "../types/ContextType";
import * as jwt from "jsonwebtoken";

export function CurrentUser() {
  return createParamDecorator<ContextType>(({ context }) => {
    return (jwt.decode(context.payload.token) as jwt.JwtPayload).name;
  });
}
