import {
  JsonController,
  Post,
  Authorized,
  Get,
  BodyParam,
  CurrentUser,
} from "routing-controllers";
import {
  Arg,
  Authorized as GraphAuthorized,
  Mutation,
  Query,
  Resolver,
} from "type-graphql";
import { InjectRepository } from "typeorm-typedi-extensions";
import { Service } from "typedi";
import { Repository } from "typeorm";
import { Post as PostObject } from "../entity/Post";
import { Author } from "../entity/Author";
import { CurrentUser as GraphCurrentUser } from "../decorators/UserDecorator";
import { User } from "../entity/User";

@Resolver(PostObject)
@JsonController("/posts")
@Service()
export class PostsResolver {
  @InjectRepository(User)
  private readonly userRepository: Repository<User>;

  @InjectRepository(Author)
  private readonly authorRepository: Repository<Author>;

  @InjectRepository(PostObject)
  private readonly postsRepository: Repository<PostObject>;

  @Query(() => [PostObject])
  @Get("/")
  posts() {
    return this.postsRepository.find({ relations: ["authors"] });
  }

  @Authorized()
  @GraphAuthorized()
  @Mutation(() => Boolean)
  @Post("/create")
  async createPost(
    @BodyParam("title") @Arg("title") title: string,
    @BodyParam("body") @Arg("body") body: string,
    @CurrentUser() @GraphCurrentUser() username: string
  ) {
    const user = await this.userRepository.findOne(
      { username },
      {
        relations: ["author"],
      }
    );

    if (!user) {
      return false;
    }

    const author = await this.authorRepository.findOne(user.author, {
      relations: ["posts"],
    });

    const post = this.postsRepository.create({
      title,
      body,
      authors: [author],
    });

    await this.postsRepository.save(post);

    !!author.posts ? author.posts.push(post) : (author.posts = [post]);

    await this.authorRepository.save(author);

    return true;
  }
}
