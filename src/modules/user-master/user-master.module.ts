import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { UtilsModule } from "src/utils/utils.module";
import { DaoModule } from "../dao/dao.module";
import { MongoModule } from "../mongo/mongo.module";
import { UserHelperService } from "./user-helper/user-helper.service";
import { UserMasterController } from "./user-master.controller";
import { UserMasterService } from "./user-master.service";
import { AppLoggerModule } from "src/app-logger/app-logger.module";
import { UserSchedularController } from "./schedular/user-schedular.controller";
import { UserSchedularService } from "./schedular/user-schedular.service";

@Module({
	imports: [HttpModule, UtilsModule, DaoModule, MongoModule, AppLoggerModule],
	controllers: [UserMasterController, UserSchedularController],
	providers: [UserMasterService, UserHelperService, UserSchedularService],
	exports: [UserMasterService, UserHelperService]
})
export class UserMasterModule {}
