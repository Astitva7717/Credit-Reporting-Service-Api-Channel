import { KafkaRequestDaoService } from "@modules/dao/kafka-request-dao/kafka-request-dao.service";
import { Injectable } from "@nestjs/common";
import { SchedulerHelperService } from "@utils/common/scheduler-helper/scheduler-helper.service";
import VariablesConstant from "@utils/variables-constant";
import { ProducerService } from "../producer.service";
import { ProducerRecord } from "kafkajs";
import { KafkaEventMessageDto, KafkaEventTypeEnum } from "@kafka/dto/kafka-event-message.dto";
import { UserMasterService } from "@modules/user-master/user-master.service";
import { AppLoggerService } from "src/app-logger/app-logger.service";
import { AppLoggerDto } from "@app-logger/app-logger.dto";

@Injectable()
export class NotificationProducerService {
	constructor(
		private schedulerHelperService: SchedulerHelperService,
		private kafkaRequestDao: KafkaRequestDaoService,
		private appLoggerService: AppLoggerService,
		private producerService: ProducerService,
		private userService: UserMasterService
	) {}

	async InviteParticipant(message: KafkaEventMessageDto, eventType: KafkaEventTypeEnum) {
		let kafkaRequest = null;
		try {
			let topic = VariablesConstant.SEND_EVENT_COMM;
			let eventMessage = {
				eventType: eventType,
				aliasName: message?.aliasName,
				engineCode: null,
				engineReference: null,
				languageCode: "en",
				currencyCode: message?.currencyCode,
				systemUserId: message?.systemUserId,
				chargesStatus: null,
				params: message.params,
				inboxDeepLinkParams: message.inboxDeepLinkParams,
				fcmParams: this.get_fcm_params(),
				userCommDetails: this.get_user_comm_details(message?.emailId, message?.mobileNo, null),
				userType: message?.userType,
				businessId: message?.businessId
			};
			kafkaRequest = await this.kafkaRequestDao.save({
				topic: topic,
				request: JSON.stringify(eventMessage),
				status: "IN_PROGRESS",
				retryCount: 0
			});
			let producerRecord: ProducerRecord = {
				topic: topic,
				messages: [{ value: JSON.stringify(eventMessage) }]
			};
			await this.producerService.produce(producerRecord);
			kafkaRequest.status = "DONE";
			kafkaRequest.errorResponse = null;
			await this.kafkaRequestDao.save(kafkaRequest);
		} catch (e) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.ERROR,
				"error_in_participant_invitation",
				"kafka_participant_invitation_producer",
				"CryrParticipantInvitationService",
				"InviteParticipant",
				e
			);
			appLoggerDto.addData("kafkaRequest: " + JSON.stringify(kafkaRequest));
			this.appLoggerService.writeLog(appLoggerDto);
			kafkaRequest.status = VariablesConstant.ERROR;
			kafkaRequest.errorResponse = e?.response?.status?.errorMessage ? e.response.status.errorMessage : e.message;
			await this.kafkaRequestDao.save(kafkaRequest);
		}
	}

	get_fcm_params(title = "default", clickAction = "default_action") {
		let fcmParams = {
			title: title,
			clickAction: clickAction
		};
		return fcmParams;
	}

	get_user_comm_details(emailId = null, mobileNo = null, fcmId = null) {
		let userCommDetails = {
			emailId: emailId,
			mobileNo: mobileNo,
			fcmId: fcmId
		};
		return userCommDetails;
	}
}
