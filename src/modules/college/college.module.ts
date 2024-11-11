import { Module } from "@nestjs/common";
import { CollegeService } from "./college.service";
import { CollegeController } from "./college.controller";
import { DaoModule } from "@modules/dao/dao.module";
import { UtilsModule } from "@utils/utils.module";
import { MongoModule } from "@modules/mongo/mongo.module";
import { AppLoggerModule } from "src/app-logger/app-logger.module";

@Module({
	imports: [DaoModule, UtilsModule, MongoModule, AppLoggerModule],
	controllers: [CollegeController],
	providers: [CollegeService]
})
export class CollegeModule {}
