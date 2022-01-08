import { Get, JsonController, Param } from "routing-controllers";
import { Arg, Int, Query, Resolver } from "type-graphql";
import { Service } from "typedi";
import { Repository } from "typeorm";
import { InjectRepository } from "typeorm-typedi-extensions";
import { Author } from "../entity/Author";

@Resolver(Author)
@JsonController("/authors")
@Service()
export class AuthorsResolver {
  @InjectRepository(Author)
  private readonly authorRepository: Repository<Author>;

  @Query(() => [Author], { nullable: true })
  @Get("/")
  authors() {
    return this.authorRepository.find({ relations: ["posts"] });
  }

  @Query(() => Author, { nullable: true })
  @Get("/:id")
  async author(@Arg("id", () => Int) @Param("id") id: number) {
    return this.authorRepository.findOne(id, { relations: ["posts"] });
  }
}
