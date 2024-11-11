import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ResponseData } from "@utils/enums/response";
import { InviteMethodType, RequestStatusEnum } from "@utils/enums/Status";
import { ParticipantDaoService } from "@modules/dao/participant-dao/participant-dao.service";
import { GetInvitedData } from "./dto/get-invited-data.dto";
import { InviteParticipantAppDto } from "./dto/invite-participant-app.dto";
import VariablesConstant from "@utils/variables-constant";
import { UserMasterEntity } from "@modules/user-master/entities/user-master.entity";
import { UserDaoService } from "@modules/dao/user-dao/user-dao.service";
import { InviteUserParams, KafkaEventMessageDto, KafkaEventTypeEnum } from "@kafka/dto/kafka-event-message.dto";
import { ConfigService } from "src/config";
import { UserType } from "@utils/enums/user-types";
import { NotificationProducerService } from "@kafka/producer/notification-producer/notification-producer-service";
import { ConfigurationService } from "@utils/configuration/configuration.service";
import { ConfigCodeEnum } from "@utils/enums/constants";
@Injectable()
export class ParticipantService {
	constructor(
		private readonly participantDaoService: ParticipantDaoService,
		private readonly userDaoService: UserDaoService,
		private readonly configService: ConfigService,
		private readonly notificationProducerService: NotificationProducerService,
		private readonly configurationService: ConfigurationService
	) {}

	async verifyInviteeCode(verifyInviteeCodeDto: GetInvitedData, request: any) {
		const { verificationCode } = verifyInviteeCodeDto;
		if (!verificationCode) {
			throw new HttpException({ status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
		}

		let inviteeData = await this.participantDaoService.getRequestedParticipantData(
			verificationCode,
			RequestStatusEnum.REQUESTED
		);

		if (!inviteeData) {
			inviteeData = await this.participantDaoService.getPaymentRequestedParticipantData(
				verificationCode,
				RequestStatusEnum.REQUESTED
			);
		}

		if (!inviteeData) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}

		return inviteeData;
	}

	async inviteParticipantFromApp(body: InviteParticipantAppDto, request: any) {
		const { participantMapRequestId, name, inviteMethod, invitationData } = body;
		const { aliasName } = request.headers;
		const userDetailModel = request[VariablesConstant.USER_DETAIL_MODEL];
		const configs = await this.configurationService.getChannelConfigurations(userDetailModel.channelId);
		const mobileCode = body.mobileCode || configs.get(ConfigCodeEnum.COUNTRY_CODE) || "+91";
		const participantMapData = await this.participantDaoService.getParticipantDataByIdAndUserId(
			participantMapRequestId,
			userDetailModel.userId
		);
		const isParticipantPresent = await this.participantDaoService.getParticipantDataForNewParticipant(
			userDetailModel.userId,
			participantMapData.refdocId,
			invitationData,
			RequestStatusEnum.NEW_PARTICIPANT
		);
		if (isParticipantPresent.length) {
			throw new HttpException({ status: ResponseData.DATA_ALREADY_EXIST }, HttpStatus.OK);
		}
		let participantInfo: UserMasterEntity;
		if (inviteMethod === InviteMethodType.MOBILE) {
			if (userDetailModel.mobileNo === invitationData) {
				throw new HttpException({ status: ResponseData.INVALID_MOBILE_NO }, HttpStatus.OK);
			}
			participantInfo = await this.userDaoService.getUserInfoByMobile(mobileCode, invitationData);
			participantMapData.mobile = invitationData;
		}
		if (inviteMethod === InviteMethodType.EMAIL) {
			if (userDetailModel.emailId === invitationData) {
				throw new HttpException({ status: ResponseData.INVALID_EMAIL }, HttpStatus.OK);
			}
			participantInfo = await this.userDaoService.getUserInfoByEmailId(invitationData);
			participantMapData.emailId = invitationData;
		}
		if (participantInfo) {
			participantMapData.participantUserId = participantInfo.userId;
		}
		participantMapData.name = name;
		participantMapData.status = RequestStatusEnum.REQUESTED;
		await this.participantDaoService.createParticipantMapRequest(participantMapData);

		const kafkaEventMessageDto: KafkaEventMessageDto[] = [];
		const frontendBaseUrl = this.configService.get("CRYR_FRONTEND_BASE_URL");
		const invitedUrlKey = "invited";
		const invitaionLink = `${frontendBaseUrl}/${invitedUrlKey}`;
		const invitationCode = participantMapData.verificationCode;
		const primaryUserFullName =
			userDetailModel.firstName + (userDetailModel.lastName ? " " + userDetailModel.lastName : "");
		const kafkaEventMessageDtoObj = new KafkaEventMessageDto(
			aliasName,
			userDetailModel.currencyCode,
			mobileCode + participantMapData.mobile,
			participantMapData.emailId,
			participantInfo ? participantInfo?.userType : UserType.CONSUMER
		);
		kafkaEventMessageDtoObj.addDetails(participantInfo ? participantInfo?.userId : null, userDetailModel.businessId);
		const params: InviteUserParams = {
			invitationCode: invitationCode,
			invitationLink: invitaionLink,
			userName: primaryUserFullName
		};
		kafkaEventMessageDtoObj.addParmas(params);
		kafkaEventMessageDto.push(kafkaEventMessageDtoObj);
		this.sendUserInvitation(kafkaEventMessageDto);
	}

	async sendUserInvitation(kafkaEventMessageDto: KafkaEventMessageDto[]) {
		if (kafkaEventMessageDto.length) {
			this.sendInvitaionKafkaRequest(kafkaEventMessageDto, KafkaEventTypeEnum.INVITE_USER);
		}
	}

	sendInvitaionKafkaRequest(requests: KafkaEventMessageDto[], eventType: KafkaEventTypeEnum) {
		requests.forEach((request) => {
			this.notificationProducerService.InviteParticipant(request, eventType);
		});
	}
}
