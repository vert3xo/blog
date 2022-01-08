require("dotenv").config();
import "reflect-metadata";
import { createConnection } from "typeorm";
import { Container } from "typedi";
import { useContainer as ormUseContainer } from "typeorm";
import { Ctx, useContainer as rcUseContainer } from "routing-controllers";
import * as bodyParser from "body-parser";
import { createExpressServer } from "routing-controllers";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { AuthorsResolver } from "./resolvers/AuthorsResolver";
import { PostsResolver } from "./resolvers/PostsResolver";
import { UsersResolver } from "./resolvers/UsersResolver";
import { authCheck } from "./authorization/authCheck";
import { ContextType } from "./types/ContextType";
import * as jwt from "jsonwebtoken";

const port = process.env.PORT || 3000;

ormUseContainer(Container);
rcUseContainer(Container);

createConnection({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: false,
  entities: [`${__dirname}/entity/*`],
  migrations: [`${__dirname}/migration/*`],
  subscribers: [`${__dirname}/subscriber/*`],
})
  .then(async (connection) => {
    // create express app
    const app = createExpressServer({
      controllers: [AuthorsResolver, PostsResolver, UsersResolver],
      authorizationChecker: async (action, roles) => {
        const { authorization } = action.request.headers;
        if (!authorization) {
          return false;
        }

        const authorizationParts = (authorization as string).split(" ");
        if (!!authorizationParts[0] && !!authorizationParts[1]) {
          return authCheck(
            {
              root: null,
              args: null,
              context: {
                req: action.request,
                res: action.response,
                payload: {
                  token: authorizationParts[1],
                  roles: [authorizationParts[0]],
                },
              },
              info: null,
            },
            roles
          );
        }

        return false;
      },
      currentUserChecker: async (action) => {
        const { authorization } = action.request.headers;
        const token = (authorization as string).split(" ")[1];

        return (jwt.decode(token) as jwt.JwtPayload).name;
      },
    });
    app.use(bodyParser.json());

    const apollo = new ApolloServer({
      schema: await buildSchema({
        resolvers: [AuthorsResolver, PostsResolver, UsersResolver],
        authChecker: authCheck,
        container: Container,
      }),
      context: (ctx): ContextType => {
        const defaultRet: ContextType = { req: ctx.req, res: ctx.res };
        const { authorization } = ctx.req.headers;
        if (!authorization) {
          return defaultRet;
        }

        const authorizationParts = (authorization as string).split(" ");
        if (!!authorizationParts[0] && !!authorizationParts[1]) {
          return {
            ...defaultRet,
            payload: {
              token: authorizationParts[1],
              roles: [authorizationParts[0]],
            },
          };
        }

        return defaultRet;
      },
    });
    await apollo.start();

    apollo.applyMiddleware({ app });

    // start express server
    app.listen(port);

    console.log(`Express server has started on port ${port}`);
  })
  .catch((error) => console.log(error));
