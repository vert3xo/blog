import {
  JsonController,
  Post,
  Authorized,
  Get,
  BodyParam,
  CurrentUser,
  Param,
} from "routing-controllers";
import {
  Arg,
  Authorized as GraphAuthorized,
  Int,
  Mutation,
  Query,
  Resolver,
} from "type-graphql";
import { InjectRepository } from "typeorm-typedi-extensions";
import { Service } from "typedi";
import { Repository } from "typeorm";
import { Post as PostEntity } from "../entity/Post";
import { Author } from "../entity/Author";
import { CurrentUser as GraphCurrentUser } from "../decorators/UserDecorator";
import { User } from "../entity/User";

@Resolver(PostEntity)
@JsonController("/posts")
@Service()
export class PostsResolver {
  @InjectRepository(User)
  private readonly userRepository: Repository<User>;

  @InjectRepository(Author)
  private readonly authorRepository: Repository<Author>;

  @InjectRepository(PostEntity)
  private readonly postsRepository: Repository<PostEntity>;

  @Query(() => [PostEntity], { nullable: true })
  @Get("/")
  posts() {
    return this.postsRepository.find({ relations: ["authors"] });
  }

  @Query(() => PostEntity, { nullable: true })
  @Get("/:id")
  post(@Arg("id", () => Int) @Param("id") id: number) {
    return this.postsRepository.findOne(id, {
      relations: ["authors"],
    });
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

    const author = await this.authorRepository.findOne(user.author.id, {
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

  @Authorized()
  @GraphAuthorized()
  @Mutation(() => Boolean)
  @Post("/delete")
  async deletePost(@BodyParam("id") @Arg("id", () => Int) id: number) {
    await this.postsRepository.delete({ id });
    return true;
  }
}
