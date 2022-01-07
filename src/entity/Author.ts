import { Field, Int, ObjectType } from "type-graphql";
import {
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  JoinTable,
  OneToOne,
} from "typeorm";
import { Post } from "./Post";
import { User } from "./User";

@ObjectType()
@Entity()
export class Author {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  name: string;

  @Field(() => [Post], { nullable: true })
  @ManyToMany(() => Post, (post) => post.authors)
  @JoinTable()
  posts: Post[];

  @OneToOne(() => User, (user) => user.author)
  user: User;
}
