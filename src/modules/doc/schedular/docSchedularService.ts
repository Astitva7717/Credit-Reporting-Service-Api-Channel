import { DocDaoService } from "@modules/dao/doc-dao/doc-dao.service";
import { UserDaoService } from "@modules/dao/user-dao/user-dao.service";
import { Injectable } from "@nestjs/common";
import { RefdocMasterStatusEnum } from "../entities/refdoc-master.entity";
import { KafkaEventTypeEnum } from "@kafka/dto/kafka-event-message.dto";
import { AliasDaoService } from "@modules/dao/alias-dao/alias-dao.service";
import { DocHelperService } from "../doc-helper/doc-helper.service";
import { ScreenNames } from "@utils/enums/communication-enums";
import { SchedulerHelperService } from "@utils/common/scheduler-helper/scheduler-helper.service";
import { Cron } from "@nestjs/schedule";
import { AppLoggerDto } from "@app-logger/app-logger.dto";
import VariablesConstant from "@utils/variables-constant";
import { AppLoggerService } from "@app-logger/app-logger.service";
import { DataSource } from "typeorm";
import { DocTypeRefdocEnum } from "@utils/enums/user-communication";

@Injectable()
export class DocSchedularService {
	constructor(
		private readonly docDaoService: DocDaoService,
		private readonly userDaoService: UserDaoService,
		private readonly aliasDaoService: AliasDaoService,
		private readonly docHelperService: DocHelperService,
		private schedulerHelperService: SchedulerHelperService,
		private readonly appLoggerService: AppLoggerService,
		private readonly schedularHelperService: SchedulerHelperService,
		private readonly dataSource: DataSource
	) {}
	async expireRefdocs() {
		const expiredRefdocs = await this.docDaoService.getRefdocsByValidToAnsStatus(
			new Date(),
			RefdocMasterStatusEnum.APPROVED
		);
		const eventType = KafkaEventTypeEnum.DOCUMENT_EXPIRY;
		let aliasNameObj= {};
		for (let refdoc of expiredRefdocs) {
			const userInfo = await this.userDaoService.getUserInfoByUserId(refdoc.userId);
			const refdocTypeData = await this.docDaoService.getRefDocTypeById(refdoc.refdocTypeId);
			if (!Object.keys(aliasNameObj).includes(userInfo.aliasId.toString())) {
				aliasNameObj[userInfo.aliasId] = await this.aliasDaoService.getAliasDataByUserId(userInfo.userId);
			}

			this.docHelperService.sendUserEvent(
				userInfo,
				DocTypeRefdocEnum.LEASE,
				eventType,
				aliasNameObj[userInfo.aliasId].aliasName,
				refdocTypeData.name,
				ScreenNames.LEASE_SCREEN_NAME,
				refdoc.refdocId
			);
		}
		const refdocHistoryData = [];
		expiredRefdocs.forEach((refdoc) => {
			refdoc.status = RefdocMasterStatusEnum.EXPIRED;
			refdocHistoryData.push(refdoc);
		});
		
		const queryRunner = this.dataSource.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			await this.docDaoService.saveMultipleRefdocMastersByQueryRunner(queryRunner,expiredRefdocs);
		    await this.docDaoService.insertMultipleRefdocHistoryDataByQueryRunner(queryRunner,refdocHistoryData);
			await queryRunner.commitTransaction();
		} catch (error) {
			await queryRunner.rollbackTransaction();
			throw error;
		} finally {
			await queryRunner.release();
		}
		
	}

	@Cron(`${process.env.CHECK_REFDOC_VALIDITY_EXPRESSION}`)
	async checkRefdocValidity() {
		let flag = await this.schedulerHelperService.checkAndUpdateSchedulerRunningStatus(
			"CHECK_REFDOC_VALIDITY_EXPRESSION"
		);
		if (!flag) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.INFO,
				"Scheduler Already Running - CHECK_REFDOC_VALIDITY_EXPRESSION",
				"doc.module",
				"doc.service",
				"checkRefdocValidity",
				null
			);
			this.appLoggerService.writeLog(appLoggerDto);
			return;
		}
		try {
			await this.expireRefdocs();
		} catch (err) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.ERROR,
				"CHECK_REFDOC_VALIDITY_EXPRESSION_ERROR",
				"doc.module",
				"doc.service",
				"checkRefdocValidity",
				err
			);
			this.appLoggerService.writeLog(appLoggerDto);
		}
		await this.schedulerHelperService.updateSchedulerRunningStatus("CHECK_REFDOC_VALIDITY_EXPRESSION", 0);
	}

	async schedularUpdate() {
		await this.schedularHelperService.schedulerUpdate();
	}
}
