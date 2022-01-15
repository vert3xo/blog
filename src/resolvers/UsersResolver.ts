require("dotenv").config();
import {
  Authorized,
  BodyParam,
  JsonController,
  Get,
  Post,
  Param,
} from "routing-controllers";
import { Ctx } from "../decorators/Ctx";
import {
  Arg,
  Mutation,
  Query,
  Resolver,
  Authorized as GraphAuthorized,
  Int,
  Ctx as GraphCtx,
} from "type-graphql";
import { Service } from "typedi";
import { Repository } from "typeorm";
import { InjectRepository } from "typeorm-typedi-extensions";
import bcrypt from "bcrypt";
import { Author } from "../entity/Author";
import { User } from "../entity/User";
import { Role } from "../types/Role";
import { ContextType } from "../types/ContextType";
import { generateAccessToken, generateRefreshToken } from "../utils/jwtUtil";
import * as jwt from "jsonwebtoken";

@Resolver(User)
@JsonController("/users")
@Service()
export class UsersResolver {
  @InjectRepository(User)
  private readonly userRepository: Repository<User>;

  @InjectRepository(Author)
  private readonly authorRepository: Repository<Author>;

  @Authorized([Role.Admin])
  @GraphAuthorized([Role.Admin])
  @Query(() => [User], { nullable: true })
  @Get("/")
  users() {
    return this.userRepository.find({ relations: ["author"] });
  }

  @Authorized([Role.Admin])
  @GraphAuthorized([Role.Admin])
  @Query(() => User, { nullable: true })
  @Get("/:id")
  user(@Arg("id", () => Int) @Param("id") id: number) {
    return this.userRepository.findOne(id, { relations: ["author"] });
  }

  @Authorized()
  @GraphAuthorized()
  @Query(() => User, { nullable: true })
  @Get("/me")
  me(@GraphCtx() @Ctx() context: ContextType) {
    if (!context.payload) {
      return null;
    }
    const username = (jwt.decode(context.payload.token) as jwt.JwtPayload).name;

    if (!username) {
      return null;
    }

    return this.userRepository.findOne({ username }, { relations: ["author"] });
  }

  @Post("/login")
  @Mutation(() => String, { nullable: true })
  async login(
    @BodyParam("username") @Arg("username") username: string,
    @BodyParam("password") @Arg("password") password: string,
    @GraphCtx() @Ctx() context: ContextType
  ) {
    const user = await this.userRepository.findOne({ username });
    if (!user) {
      return null;
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return null;
    }

    context.res.cookie(
      "blog_refresh_token",
      generateRefreshToken(
        user.username,
        user.admin ? Role.Admin : Role.Regular
      ),
      { httpOnly: true }
    );

    return generateAccessToken(
      user.username,
      user.admin ? Role.Admin : Role.Regular
    );
  }

  @Post("/register")
  @Mutation(() => Boolean)
  async register(
    @BodyParam("username") @Arg("username") username: string,
    @BodyParam("name") @Arg("name") name: string,
    @BodyParam("password") @Arg("password") password: string
  ) {
    if (await this.userRepository.findOne({ username })) {
      return false;
    }

    const user = this.userRepository.create({
      username,
      password: bcrypt.hashSync(password, bcrypt.genSaltSync()),
    });

    const author = this.authorRepository.create({ name, user });

    await this.authorRepository.save(author);

    user.author = author;

    await this.userRepository.save(user);

    return true;
  }
}
