import { Entity } from "typeorm";
import { CommonMongoEntity } from "./CommonMongoEntity";

@Entity()
export class MongoBackofficeApis extends CommonMongoEntity {}
