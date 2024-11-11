import { AppLoggerDto } from "@app-logger/app-logger.dto";
import { AppLoggerService } from "@app-logger/app-logger.service";
import { KafkaRequest } from "@kafka/entity/kafka-request.entity";
import { KafkaRequestDaoService } from "@modules/dao/kafka-request-dao/kafka-request-dao.service";
import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { SchedulerHelperService } from "@utils/common/scheduler-helper/scheduler-helper.service";
import VariablesConstant from "@utils/variables-constant";
import { UserMasterService } from "../user-master.service";

@Injectable()
export class UserSchedularService {
	constructor(
		private readonly schedulerHelperService: SchedulerHelperService,
		private readonly appLoggerService: AppLoggerService,
		private readonly kafkaRequestDao: KafkaRequestDaoService,
		private readonly userService: UserMasterService
	) {}

	@Cron(`${process.env.KAFKA_REGISTER_USER_FAILED_EXPRESSION}`)
	async kafkaUserRegistrationFailedCorrection() {
		let flag = await this.schedulerHelperService.checkAndUpdateSchedulerRunningStatus(
			"KAFKA_REGISTER_USER_FAILED_EXPRESSION"
		);
		if (!flag) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.INFO,
				"Scheduler Already Running - KAFKA_REGISTER_USER_FAILED_EXPRESSION",
				"kafka_registration_scheduler",
				"RegistrationService",
				"kafkaUserRegistrationFailedCorrection",
				null
			);
			this.appLoggerService.writeLog(appLoggerDto);
			return;
		}

		let erroredKafkaRequest = await this.kafkaRequestDao.findByTopicAndStatusAndRetryCount("REGISTRATION", "ERROR", 3);
		if (erroredKafkaRequest.length > 0) {
			const updatedKafkaRequests = new Array();
			for (let kafkaRequest of erroredKafkaRequest) {
				await this.updateKafkaRequestsForUserRegister(kafkaRequest, updatedKafkaRequests);
			}
			if (updatedKafkaRequests.length > 0) {
				await this.kafkaRequestDao.saveAll(updatedKafkaRequests);
			}
		}
		await this.schedulerHelperService.updateSchedulerRunningStatus("KAFKA_REGISTER_USER_FAILED_EXPRESSION", 0);
	}

	async updateKafkaRequestsForUserRegister(kafkaRequest: KafkaRequest, updatedKafkaRequests) {
		try {
			await this.userService.registerUser(JSON.parse(kafkaRequest.request));
			kafkaRequest.status = "DONE";
			kafkaRequest.errorResponse = null;
			updatedKafkaRequests.push(kafkaRequest);
		} catch (e) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.ERROR,
				"error_in_kafka_registration_scheduler",
				"kafka_registration_scheduler",
				"RegistrationService",
				"kafkaUserRegistrationFailedCorrection",
				e
			);
			appLoggerDto.addData("kafkaRequest: " + JSON.stringify(kafkaRequest));
			this.appLoggerService.writeLog(appLoggerDto);
			kafkaRequest.status = VariablesConstant.ERROR;
			kafkaRequest.errorResponse = e?.response?.status?.errorMessage ? e.response.status.errorMessage : e.message;
			let retryC = kafkaRequest?.retryCount ? kafkaRequest.retryCount : 0;
			retryC = retryC + 1;
			kafkaRequest.retryCount = retryC;
			updatedKafkaRequests.push(kafkaRequest);
		}
	}

	@Cron(`${process.env.KAFKA_UPDATE_USER_FAILED_EXPRESSION}`)
	async kafkaUserUpdateFailedCorrection() {
		let flag = await this.schedulerHelperService.checkAndUpdateSchedulerRunningStatus(
			"KAFKA_UPDATE_USER_FAILED_EXPRESSION"
		);
		if (!flag) {
			console.log("Scheduler Already Running - KAFKA_UPDATE_USER_FAILED_EXPRESSION");
			return;
		}

		let erroredKafkaRequest = await this.kafkaRequestDao.findByTopicAndStatusAndRetryCount(
			VariablesConstant.UPDATE,
			"ERROR",
			3
		);
		if (erroredKafkaRequest.length > 0) {
			const updatedKafkaRequests = new Array();
			for (let kafkaRequest of erroredKafkaRequest) {
				await this.updateKafkaRequestsForUserUpdate(kafkaRequest, updatedKafkaRequests);
			}
			if (updatedKafkaRequests.length > 0) {
				await this.kafkaRequestDao.saveAll(updatedKafkaRequests);
			}
		}
		await this.schedulerHelperService.updateSchedulerRunningStatus("KAFKA_UPDATE_USER_FAILED_EXPRESSION", 0);
	}

	async updateKafkaRequestsForUserUpdate(kafkaRequest: KafkaRequest, updatedKafkaRequests) {
		try {
			await this.userService.updateUser(JSON.parse(kafkaRequest.request));
			kafkaRequest.status = "DONE";
			kafkaRequest.errorResponse = null;
			updatedKafkaRequests.push(kafkaRequest);
		} catch (e) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.ERROR,
				"error_in_scheduler_for_user_update_falied_by_kafka",
				"kafkaModule",
				"UpdateService",
				"kafkaUserUpdateFailedCorrection",
				e
			);
			this.appLoggerService.writeLog(appLoggerDto);
			kafkaRequest.status = VariablesConstant.ERROR;
			kafkaRequest.errorResponse = e?.response?.status?.errorMessage ? e.response.status.errorMessage : e.message;
			let retryC = kafkaRequest?.retryCount ? kafkaRequest.retryCount : 0;
			retryC = retryC + 1;
			kafkaRequest.retryCount = retryC;
			updatedKafkaRequests.push(kafkaRequest);
		}
	}
}
