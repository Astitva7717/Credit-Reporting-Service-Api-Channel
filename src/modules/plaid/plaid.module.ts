import { Module } from "@nestjs/common";
import { UtilsModule } from "src/utils/utils.module";
import { DaoModule } from "../dao/dao.module";
import { MongoModule } from "@modules/mongo/mongo.module";
import { AppLoggerModule } from "src/app-logger/app-logger.module";
import { PlaidController } from "./plaid.controller";
import { PlaidService } from "./plaid.service";
import { ConfigModule } from "@nestjs/config";

@Module({
	imports: [UtilsModule, DaoModule, MongoModule, AppLoggerModule, ConfigModule],
	controllers: [PlaidController],
	providers: [PlaidService],
	exports: [PlaidService]
})
export class PlaidModule {}
