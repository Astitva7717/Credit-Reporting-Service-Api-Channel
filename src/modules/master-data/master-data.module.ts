import { Module } from "@nestjs/common";
import { UtilsModule } from "src/utils/utils.module";
import { DaoModule } from "../dao/dao.module";
import { MongoModule } from "../mongo/mongo.module";
import { MasterDataController } from "./master-data.controller";
import { MasterDataService } from "./master-data.service";
import { AppLoggerModule } from "src/app-logger/app-logger.module";

@Module({
	imports: [DaoModule, UtilsModule, MongoModule, AppLoggerModule],
	controllers: [MasterDataController],
	providers: [MasterDataService],
	exports: [MasterDataService]
})
export class MasterDataModule {}
