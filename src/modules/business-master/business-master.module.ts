import { Module } from "@nestjs/common";
import { BusinessMasterService } from "./business-master.service";
import { BusinessMasterController } from "./business-master.controller";
import { DaoModule } from "../dao/dao.module";
import { UtilsModule } from "src/utils/utils.module";
import { MongoModule } from "../mongo/mongo.module";
import { UserMasterModule } from "../user-master/user-master.module";
import { BackOfficeMasterModule } from "../back-office-master/back-office-master.module";
import { AppLoggerModule } from "src/app-logger/app-logger.module";

@Module({
	imports: [DaoModule, UtilsModule, MongoModule, UserMasterModule, BackOfficeMasterModule, AppLoggerModule],
	controllers: [BusinessMasterController],
	providers: [BusinessMasterService],
	exports: [BusinessMasterService]
})
export class BusinessMasterModule {}
