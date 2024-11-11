import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { DaoModule } from "src/modules/dao/dao.module";
import { CommonUtilityService } from "./common/common-utility/common-utility.service";
import { ExternalApiCallService } from "./common/external-api-call/external-api-call.service";
import { ValidateStructureService } from "./common/validate-structure/validate-structure.service";
import { ConfigurationService } from "./configuration/configuration.service";
import { CommonExceptionFilter } from "./filters/commonException/common-exception.filter";
import { AuthenticationGuard } from "./guards/authentication/authentication-gaurd";
import { ResponseInterceptor } from "./middlewares/response/response.interceptor";
import { MongoModule } from "src/modules/mongo/mongo.module";
import { SchedulerHelperService } from "./common/scheduler-helper/scheduler-helper.service";
import { ExternalUrlsService } from "./constants/urls";
import { ConfigModule } from "src/config/config.module";
import { AppLoggerModule } from "src/app-logger/app-logger.module";

@Module({
	imports: [DaoModule, HttpModule, MongoModule, ConfigModule, AppLoggerModule],
	providers: [
		CommonUtilityService,
		ExternalApiCallService,
		AuthenticationGuard,
		ConfigurationService,
		CommonExceptionFilter,
		ValidateStructureService,
		ResponseInterceptor,
		SchedulerHelperService,
		ExternalUrlsService,
	],
	exports: [
		CommonUtilityService,
		ExternalApiCallService,
		AuthenticationGuard,
		ConfigurationService,
		CommonExceptionFilter,
		ValidateStructureService,
		ResponseInterceptor,
		SchedulerHelperService,
		ExternalUrlsService,
	]
})
export class UtilsModule {}
