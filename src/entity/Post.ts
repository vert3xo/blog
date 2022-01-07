import { Field, Int, ObjectType } from "type-graphql";
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Author } from "./Author";

@ObjectType()
@Entity()
export class Post {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column()
  body: string;

  @Field(() => [Author])
  @ManyToMany(() => Author, (author) => author.posts)
  authors: Author[];
}
