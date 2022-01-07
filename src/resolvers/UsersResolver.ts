import {
  Authorized,
  BodyParam,
  JsonController,
  Get,
  Post,
} from "routing-controllers";
import {
  Arg,
  Mutation,
  Query,
  Resolver,
  Authorized as GraphAuthorized,
} from "type-graphql";
import { Service } from "typedi";
import { Repository } from "typeorm";
import { InjectRepository } from "typeorm-typedi-extensions";
import { Author } from "../entity/Author";
import { User } from "../entity/User";
import { Role } from "../types/Role";

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
  @Query(() => [User])
  @Get("/")
  users() {
    return this.userRepository.find({ relations: ["author"] });
  }

  @Post("/create")
  @Mutation(() => Boolean)
  async createUser(
    @BodyParam("username") @Arg("username") username: string,
    @BodyParam("name") @Arg("name") name: string,
    @BodyParam("password") @Arg("password") password: string
  ) {
    if (await this.userRepository.findOne({ username })) {
      return false;
    }

    const user = this.userRepository.create({
      username,
      password,
    });

    const author = this.authorRepository.create({ name, user });

    await this.authorRepository.save(author);

    user.author = author;

    await this.userRepository.save(user);

    return true;
  }
}
