import { Field, Int, ObjectType } from "type-graphql";
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Author } from "./Author";

@ObjectType()
@Entity()
export class User {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ default: false })
  admin: boolean;

  @Field()
  @Column()
  username: string;

  @Field()
  @Column()
  password: string;

  @Field(() => Author)
  @OneToOne(() => Author, (author) => author.user)
  @JoinColumn()
  author: Author;
}
