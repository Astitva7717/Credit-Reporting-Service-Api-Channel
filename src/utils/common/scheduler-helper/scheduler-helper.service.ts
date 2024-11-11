import { AppLoggerDto } from "@app-logger/app-logger.dto";
import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { AppLoggerService } from "src/app-logger/app-logger.service";
import { SchedulerDaoService } from "src/modules/dao/scheduler-dao/scheduler-dao.service";
import { ConfigurationService } from "src/utils/configuration/configuration.service";
import VariablesConstant from "src/utils/variables-constant";
import { DataSource } from "typeorm";
require("dotenv").config();

@Injectable()
export class SchedulerHelperService {
	constructor(
		private schedulerDao: SchedulerDaoService,
		private dataSource: DataSource,
		private configurationService: ConfigurationService,
		private appLoggerService: AppLoggerService
	) {}

	async checkAndUpdateSchedulerRunningStatus(schedulerName: string) {
		const queryRunner = this.dataSource.createQueryRunner();
		let flag = Boolean(true);
		let schedulerMaster;
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			schedulerMaster = await this.schedulerDao.findSchedulerDataForUpdate(queryRunner, schedulerName);

			if (schedulerMaster) {
				if (schedulerMaster.status === 1) {
					if (schedulerMaster.runningStatus === 1) {
						flag = false;
					} else {
						await this.schedulerDao.updateSchedulerDBStatus(queryRunner, 1, new Date(), schedulerMaster.id);
					}
				} else {
					flag = false;
				}
			} else {
				flag = false;
			}
			await queryRunner?.commitTransaction();
		} catch (e) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.ERROR,
				"error_in_check_and_update_scheduler_running_status",
				"UtilsModule",
				"SchedulerHelperService",
				"checkAndUpdateSchedulerRunningStatus",
				e
			);
			appLoggerDto.addData(schedulerMaster);
			this.appLoggerService.writeLog(appLoggerDto);
			await queryRunner?.rollbackTransaction();
		} finally {
			await queryRunner?.release();
		}
		return flag;
	}

	async updateSchedulerRunningStatus(schedulerName: string, runningStatus: number) {
		let schedulerMaster = await this.schedulerDao.findBySchedulerName(schedulerName);
		if (schedulerMaster) {
			schedulerMaster.runningStatus = runningStatus;
			schedulerMaster.updatedAt = new Date();
			await this.schedulerDao.save(schedulerMaster);
		}
	}

	@Cron(`${process.env.SCHEDULER_UPDATE_EXPRESSION}`)
	async schedulerUpdate() {
		const queryRunner = this.dataSource.createQueryRunner();
		let configMap;
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();

			configMap = await this.configurationService.getBusinessConfigurations(0);
			await this.schedulerDao.updateRunningStatus(queryRunner, configMap.get("SCHEDULER_UNBLOCK_DURATION"));
			await queryRunner?.commitTransaction();
		} catch (e) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.ERROR,
				"scheduler_update_expression_error",
				"UtilsModule",
				"SchedulerHelperService",
				"schedulerUpdate",
				e
			);
			appLoggerDto.addData(configMap);
			this.appLoggerService.writeLog(appLoggerDto);
			await queryRunner?.rollbackTransaction();
		} finally {
			await queryRunner?.release();
		}
	}
}
