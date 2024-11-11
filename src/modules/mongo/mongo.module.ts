import { Module } from "@nestjs/common";
import { DaoModule } from "../dao/dao.module";
import { MongoService } from "./mongo.service";
import { AppLoggerModule } from "src/app-logger/app-logger.module";

@Module({
	imports: [DaoModule, AppLoggerModule],
	controllers: [],
	providers: [MongoService],
	exports: [MongoService]
})
export class MongoModule {}
