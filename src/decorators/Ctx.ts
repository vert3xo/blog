import { createParamDecorator } from "routing-controllers";
import { ContextType } from "../types/ContextType";

export function Ctx() {
  return createParamDecorator({
    value: (action): ContextType => {
      const defaultRet: ContextType = {
        req: action.request,
        res: action.response,
      };
      const { authorization } = action.request.headers;
      if (!authorization) {
        return defaultRet;
      }

      const authorizationParts = (authorization as string).split(" ");
      if (authorizationParts[0] !== "Bearer" || !authorizationParts[1]) {
        return defaultRet;
      }

      return {
        ...defaultRet,
        payload: {
          token: authorizationParts[1],
          roles: [authorizationParts[0]],
        },
      };
    },
  });
}
