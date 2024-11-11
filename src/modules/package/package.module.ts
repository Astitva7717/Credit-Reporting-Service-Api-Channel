import { Module } from "@nestjs/common";
import { PackageService } from "./package.service";
import { PackageController } from "./package.controller";
import { DaoModule } from "@modules/dao/dao.module";
import { UtilsModule } from "@utils/utils.module";
import { MongoModule } from "@modules/mongo/mongo.module";
import { AppLoggerModule } from "src/app-logger/app-logger.module";
import { PackageSchedularController } from "./schedular/schedular.controller";
import { PackageSchedularService } from "./schedular/schedular.service";

@Module({
	imports: [UtilsModule, DaoModule, MongoModule, AppLoggerModule],
	controllers: [PackageController, PackageSchedularController],
	providers: [PackageService, PackageSchedularService],
	exports: [PackageService]
})
export class PackageModule {}
