import { ObjectId } from "mongodb";
import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class Comment {
  @PrimaryKey()
  _id: ObjectId;

  @Property()
  text!: string;
}
