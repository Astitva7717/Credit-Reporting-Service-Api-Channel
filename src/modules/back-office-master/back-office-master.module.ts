import { Module } from "@nestjs/common";
import { BackOfficeMasterService } from "./back-office-master.service";
import { BackOfficeMasterController } from "./back-office-master.controller";
import { HttpModule } from "@nestjs/axios";
import { UtilsModule } from "src/utils/utils.module";
import { DaoModule } from "../dao/dao.module";
import { MongoModule } from "../mongo/mongo.module";
import { AppLoggerModule } from "src/app-logger/app-logger.module";

@Module({
	imports: [HttpModule, UtilsModule, DaoModule, MongoModule, AppLoggerModule],
	controllers: [BackOfficeMasterController],
	providers: [BackOfficeMasterService],
	exports: [BackOfficeMasterService]
})
export class BackOfficeMasterModule {}
