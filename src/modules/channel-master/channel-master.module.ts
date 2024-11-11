import { Module } from "@nestjs/common";
import { ChannelMasterService } from "./channel-master.service";
import { ChannelMasterController } from "./channel-master.controller";
import { HttpModule } from "@nestjs/axios";
import { UtilsModule } from "src/utils/utils.module";
import { DaoModule } from "../dao/dao.module";
import { MongoModule } from "../mongo/mongo.module";
import { BackOfficeMasterModule } from "../back-office-master/back-office-master.module";
import { AppLoggerModule } from "src/app-logger/app-logger.module";

@Module({
	imports: [UtilsModule, DaoModule, HttpModule, MongoModule, BackOfficeMasterModule, AppLoggerModule],
	controllers: [ChannelMasterController],
	providers: [ChannelMasterService],
	exports: [ChannelMasterService]
})
export class ChannelMasterModule {}
