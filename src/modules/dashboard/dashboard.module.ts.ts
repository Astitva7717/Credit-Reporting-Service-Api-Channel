import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { DaoModule } from "@modules/dao/dao.module";
import { UtilsModule } from "@utils/utils.module";
import { AppLoggerModule } from "@app-logger/app-logger.module";
import { MongoModule } from "@modules/mongo/mongo.module";
import { DashboardHelperService } from "./dashboard-helper/dashboard-helper.service";
import { DashboardSchedularController } from "./schedular/dashboardSchedularController";
import { DashboardSchedularService } from "./schedular/dashboardSchedularServices";

@Module({
	imports: [DaoModule, UtilsModule, AppLoggerModule, MongoModule],
	controllers: [DashboardController, DashboardSchedularController],
	providers: [DashboardService, DashboardHelperService, DashboardSchedularService]
})
export class DashboardModule {}
