import { Module } from "@nestjs/common";
import { AliasMasterService } from "./alias-master.service";
import { AliasMasterController } from "./alias-master.controller";
import { UtilsModule } from "src/utils/utils.module";
import { DaoModule } from "../dao/dao.module";
import { HttpModule } from "@nestjs/axios";
import { MongoModule } from "../mongo/mongo.module";
import { BackOfficeMasterModule } from "../back-office-master/back-office-master.module";
import { UserMasterModule } from "../user-master/user-master.module";
import { AppLoggerModule } from "src/app-logger/app-logger.module";

@Module({
	imports: [UtilsModule, DaoModule, HttpModule, MongoModule, BackOfficeMasterModule, UserMasterModule, AppLoggerModule],
	controllers: [AliasMasterController],
	providers: [AliasMasterService]
})
export class AliasMasterModule {}
