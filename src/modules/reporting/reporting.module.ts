import { Module } from "@nestjs/common";
import { ReportingService } from "./reporting.service";
import { ReportingController } from "./reporting.controller";
import { ReportingHelperService } from "./reporting-helper/reporting-helper.service";

@Module({
	controllers: [ReportingController],
	providers: [ReportingService, ReportingHelperService],
	exports: [ReportingHelperService]
})
export class ReportingModule {}
