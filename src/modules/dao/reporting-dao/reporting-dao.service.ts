import { UserCreditReportingRequests } from "@modules/reporting/entities/user-credit-reporting-request.entity";
import { Injectable } from "@nestjs/common";
import { DataSource, In, QueryRunner } from "typeorm";

@Injectable()
export class ReportingDaoService {
	constructor(private readonly dataSource: DataSource) {}

	async saveReportingRequest(reportingRequest: UserCreditReportingRequests, queryRunner: QueryRunner) {
		return await queryRunner.manager.getRepository(UserCreditReportingRequests).save(reportingRequest);
	}

	async saveMultipleReportingRequest(reportingRequest: UserCreditReportingRequests[], queryRunner: QueryRunner) {
		return await queryRunner.manager.getRepository(UserCreditReportingRequests).save(reportingRequest);
	}

	async getReportingRequestsByScheduleIds(scheduleIds: number[], queryRunner: QueryRunner) {
		return await queryRunner.manager.getRepository(UserCreditReportingRequests).find({
			where: {
				scheduleId: In(scheduleIds)
			}
		});
	}
}
