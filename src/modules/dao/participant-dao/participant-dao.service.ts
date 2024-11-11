import { ParticipantMapRequest } from "@modules/participant/entities/participant-map-request.entity";
import { PaymentUsersMappingRequest } from "@modules/participant/entities/payment-user-mapping-request.entity";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InviteeTypeEnum, RequestStatusEnum } from "@utils/enums/Status";
import { ResponseData } from "@utils/enums/response";
import { DataSource, In, Not, QueryRunner } from "typeorm";
import { UserDaoService } from "../user-dao/user-dao.service";
import {
	GetParticipantsDataByRefdocIds,
	PaymentRequestedParticipantData,
	RequestedParticipantData
} from "@utils/constants/querry-constants";
import { StatusMasterEntity } from "@modules/doc/entities/status-master.entity";

@Injectable()
export class ParticipantDaoService {
	constructor(private readonly dataSource: DataSource, private readonly userDaoService: UserDaoService) {}

	async createParticipantMapRequestByQueryRunner(participantMapRequest: ParticipantMapRequest, queryRunner: QueryRunner) {
		return await queryRunner.manager.getRepository(ParticipantMapRequest).save(participantMapRequest);
	}

	async createParticipantMapRequest(participantMapRequest: ParticipantMapRequest) {
		return await this.dataSource.getRepository(ParticipantMapRequest).save(participantMapRequest);
	}
	async createPaymentUserMappingRequestByQueryRunner(
		paymentUsersMappingRequest: PaymentUsersMappingRequest,
		queryRunner: QueryRunner
	) {
		return await queryRunner.manager.getRepository(PaymentUsersMappingRequest).save(paymentUsersMappingRequest);
	}

	async createMultipleParticipantMapRequest(participantMapRequest: ParticipantMapRequest[], queryRunner: QueryRunner) {
		return await queryRunner.manager.getRepository(ParticipantMapRequest).save(participantMapRequest);
	}

	async updateInvitedParticipantStatusByIds(ids: any[], queryRunner: QueryRunner) {
		return await queryRunner.manager
			.getRepository(ParticipantMapRequest)
			.update({ id: In(ids) }, { status: RequestStatusEnum.REJECTED, updatedAt: new Date() });
	}

	async updateParticipantUserId(queryRunner: QueryRunner, userId: number, emailId: string, mobile: string) {
		if (!emailId && !mobile) {
			return;
		}
		let query = queryRunner.manager
			.getRepository(ParticipantMapRequest)
			.createQueryBuilder()
			.update()
			.set({ participantUserId: userId });

		if (mobile && !emailId) {
			query.where(`mobile = :mobile`, { mobile });
		}
		if (emailId && !mobile) {
			query.where(`emailId= :emailId`, { emailId });
		}
		if (emailId && mobile) {
			query.where(`mobile = :mobile`, { mobile });
			query.orWhere(`emailId= :emailId`, { emailId });
		}
		await query.execute();
	}

	async updateInvitedPayeeUserId(queryRunner: QueryRunner, userId: number, emailId: string, mobile: string) {
		if (!emailId && !mobile) {
			return;
		}
		let query = queryRunner.manager
			.getRepository(PaymentUsersMappingRequest)
			.createQueryBuilder()
			.update()
			.set({ payeeUserId: userId });

		if (mobile && !emailId) {
			query.where(`mobile = :mobile`, { mobile });
		}
		if (emailId && !mobile) {
			query.where(`emailId= :emailId`, { emailId });
		}
		if (emailId && mobile) {
			query.where(`mobile = :mobile`, { mobile });
			query.orWhere(`emailId= :emailId`, { emailId });
		}
		await query.execute();
	}

	async getUserRequestedParticipantDataByEmail(userId: number, emailId: string, refdocId: number) {
		return await this.dataSource.getRepository(ParticipantMapRequest).findOne({
			where: {
				userId,
				emailId,
				refdocId
			}
		});
	}

	async getUserRequestedParticipantDataByMobile(userId: number, mobile: string, refdocId: number) {
		return await this.dataSource.getRepository(ParticipantMapRequest).findOne({
			where: {
				userId,
				mobile,
				refdocId
			}
		});
	}

	async getUserParticipantsRequestsInRefDoc(refdocId: number) {
		return await this.dataSource.getRepository(ParticipantMapRequest).find({
			where: {
				refdocId
			}
		});
	}

	async getUserParticipantsDataByParticipant(userId: number, refdocId: number, participantUserId: number) {
		let whereCondition = {
			userId,
			refdocId,
			participantUserId
		};
		let status = [RequestStatusEnum.EXPIRED, RequestStatusEnum.REJECTED];
		let requestData = await this.dataSource
			.getRepository(ParticipantMapRequest)
			.createQueryBuilder("ParticipantMapRequest")
			.select("ParticipantMapRequest.status as status")
			.addSelect("ParticipantMapRequest.id as id")
			.where(whereCondition)
			.andWhere(`ParticipantMapRequest.status NOT IN (:...status)`, { status })
			.getRawOne();
		if (!requestData) {
			throw new HttpException({ data: {}, status: ResponseData.INVALID_PAYEE }, HttpStatus.OK);
		}
		return requestData;
	}

	async getUserPaymentRequestDataByEmail(userId: number, refdocId: number, emailId: string) {
		return await this.dataSource.getRepository(PaymentUsersMappingRequest).findOne({
			where: {
				refdocId,
				userId,
				emailId
			}
		});
	}

	async getUserPaymentRequestDataByMobile(userId: number, refdocId: number, mobile: string) {
		return await this.dataSource.getRepository(PaymentUsersMappingRequest).findOne({
			where: {
				refdocId,
				userId,
				mobile
			}
		});
	}

	async getInvitedUserPaymentRequestDataByPayeeUser(userId: number, refdocId: number, payeeUserId: number) {
		let whereCondition = {
			userId,
			refdocId,
			payeeUserId
		};
		let status = [RequestStatusEnum.EXPIRED, RequestStatusEnum.REJECTED];
		let requestData = await this.dataSource
			.getRepository(PaymentUsersMappingRequest)
			.createQueryBuilder("PaymentUsersMappingRequest")
			.select("PaymentUsersMappingRequest.status as status")
			.addSelect("PaymentUsersMappingRequest.id as id")
			.where(whereCondition)
			.andWhere(`PaymentUsersMappingRequest.status NOT IN (:...status)`, { status })
			.getRawOne();
		if (!requestData) {
			throw new HttpException({ data: {}, status: ResponseData.INVALID_PAYEE }, HttpStatus.OK);
		}
		return requestData;
	}

	async getRequestedParticipantData(verificationCode: string, status: RequestStatusEnum) {
		let requestedParticipantData = await this.dataSource
			.getRepository(ParticipantMapRequest)
			.createQueryBuilder("ParticipantMapRequest")
			.select(RequestedParticipantData)
			.where({ status })
			.andWhere(`BINARY ParticipantMapRequest.verificationCode = :verificationCode`, { verificationCode })
			.getRawOne();
		if (requestedParticipantData) {
			let inviteeUserInfo = await this.userDaoService.getUserInfoByUserId(requestedParticipantData.userId);
			requestedParticipantData.userId = +inviteeUserInfo.systemUserId;
			if (requestedParticipantData.requestUserId) {
				let invitedUserInfo = await this.userDaoService.getUserInfoByUserId(requestedParticipantData.requestUserId);
				requestedParticipantData.requestUserId = +invitedUserInfo.systemUserId;
			}
			requestedParticipantData["inviteeType"] = InviteeTypeEnum.PARTICIPANT;
			return requestedParticipantData;
		}
		return null;
	}

	async getPaymentRequestedParticipantData(verificationCode: string, status: RequestStatusEnum) {
		let paymentRequestedParticipantData = await this.dataSource
			.getRepository(PaymentUsersMappingRequest)
			.createQueryBuilder("PaymentUsersMappingRequest")
			.select(PaymentRequestedParticipantData)
			.where({ status })
			.andWhere(`BINARY PaymentUsersMappingRequest.verificationCode = :verificationCode`, { verificationCode })
			.getRawOne();
		if (paymentRequestedParticipantData) {
			let inviteeUserInfo = await this.userDaoService.getUserInfoByUserId(paymentRequestedParticipantData.userId);
			paymentRequestedParticipantData.userId = +inviteeUserInfo.systemUserId;
			if (paymentRequestedParticipantData.requestUserId) {
				let invitedUserInfo = await this.userDaoService.getUserInfoByUserId(
					paymentRequestedParticipantData.requestUserId
				);
				paymentRequestedParticipantData.requestUserId = +invitedUserInfo.systemUserId;
			}
			paymentRequestedParticipantData["inviteeType"] = InviteeTypeEnum.PAYMENT_REQUEST;
			return paymentRequestedParticipantData;
		}
		return null;
	}

	async verifyInvitedParticipantVerificationCode(verificationCode: string, status: RequestStatusEnum) {
		let verificationCodeCheck = await this.dataSource.getRepository(ParticipantMapRequest).findOne({
			where: {
				verificationCode,
				status
			}
		});
		if (!verificationCodeCheck) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return verificationCodeCheck;
	}

	async verifyPaymentRequestdVerificationCode(verificationCode: string, status: RequestStatusEnum) {
		let verificationCodeCheck = await this.dataSource.getRepository(PaymentUsersMappingRequest).findOne({
			where: {
				verificationCode,
				status
			}
		});
		if (!verificationCodeCheck) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return verificationCodeCheck;
	}

	async updateInvitedParticipantRequestStatus(
		verificationCode: string,
		prevStatus: RequestStatusEnum,
		newStatus: RequestStatusEnum
	) {
		return await this.dataSource
			.getRepository(ParticipantMapRequest)
			.update({ verificationCode, status: prevStatus }, { status: newStatus, updatedAt: new Date() });
	}

	async updatePaymentRequestedParticipantStatus(
		verificationCode: string,
		prevStatus: RequestStatusEnum,
		newStatus: RequestStatusEnum
	) {
		return await this.dataSource
			.getRepository(PaymentUsersMappingRequest)
			.update({ verificationCode, status: prevStatus }, { status: newStatus, updatedAt: new Date() });
	}

	async checkVerificationCodeExistInParticipantRequest(verificationCode: string) {
		let verificationCodeCheck = await this.dataSource.getRepository(ParticipantMapRequest).findOne({
			where: {
				verificationCode
			}
		});
		return !!verificationCodeCheck;
	}

	async checkVerificationCodeExistInPaymentRequest(verificationCode: string) {
		let verificationCodeCheck = await this.dataSource.getRepository(PaymentUsersMappingRequest).findOne({
			where: {
				verificationCode
			}
		});
		return !!verificationCodeCheck;
	}

	async getParticipantRequestData(inviteeId: number, refdocId: number, emailId: string, mobile: string) {
		let where = {
			userId: inviteeId,
			refdocId
		};
		if (emailId) {
			where["emailId"] = emailId;
		}
		if (mobile) {
			where["mobile"] = mobile;
		}
		let participantRequest = await this.dataSource.getRepository(ParticipantMapRequest).findOne({
			where
		});
		return participantRequest;
	}

	async getPaymentRequestedData(inviteeId: number, refdocId: number, emailId: string, mobile: string) {
		let where = {
			userId: inviteeId,
			refdocId
		};
		if (emailId) {
			where["emailId"] = emailId;
		}
		if (mobile) {
			where["mobile"] = mobile;
		}
		let participantRequest = await this.dataSource.getRepository(PaymentUsersMappingRequest).findOne({
			where
		});
		return participantRequest;
	}

	async getUserParticipantDataByParticipantAndRefdocId(
		refdocId: number,
		participantUserId: number,
		status: RequestStatusEnum
	) {
		let participantsData = await this.dataSource.getRepository(ParticipantMapRequest).findOne({
			where: {
				participantUserId,
				refdocId,
				status
			}
		});
		if (!participantsData) {
			throw new HttpException({ status: ResponseData.INVALID_PARTICIPANT_REQUEST }, HttpStatus.OK);
		}
		return participantsData;
	}

	async getParticipantsDataByRefdocIds(refdocIds: number[]) {
		const participantMapRequests = await this.dataSource
			.getRepository(ParticipantMapRequest)
			.createQueryBuilder("request")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = request.status")
			.select(GetParticipantsDataByRefdocIds)
			.where("request.refdocId IN (:...refdocIds)", { refdocIds })
			.getRawMany();

		return participantMapRequests;
	}
	async getPaymentUserDataByRefdocIds(refdocIds: number[]) {
		return await this.dataSource.getRepository(PaymentUsersMappingRequest).find({
			where: {
				refdocId: In(refdocIds)
			}
		});
	}

	async getPaymentUserDataByPayeeIdAndRefdocId(payeeUserId: number, refdocId: number) {
		return await this.dataSource.getRepository(PaymentUsersMappingRequest).findOne({
			where: {
				refdocId,
				payeeUserId
			}
		});
	}

	async updateParticipantMapRequestsStatus(
		refdocId: number,
		participantRequestId: number,
		newStatus: RequestStatusEnum,
		queryRunner: QueryRunner,
		rejectionReasonId?: number
	) {
		const whereCondition = {
			refdocId,
			id: participantRequestId
		};
		const updateFields: Record<string, any> = {
			status: newStatus,
			updatedAt: new Date()
		};
		if (rejectionReasonId) {
			updateFields.rejectionReasonId = rejectionReasonId;
		}
		return await queryRunner.manager.getRepository(ParticipantMapRequest).update(whereCondition, updateFields);
	}

	async updatePaymentMapRequestsStatusByRefdocId(refdocId: number, status: RequestStatusEnum, queryRunner: QueryRunner) {
		const whereCondition = {
			refdocId
		};
		const updateFields: Record<string, any> = {
			status,
			updatedAt: new Date()
		};
		return await queryRunner.manager.getRepository(PaymentUsersMappingRequest).update(whereCondition, updateFields);
	}

	async getPaymentRequestDataByPayeeUserIdAndStatus(payeeUserId: number, requestStatus: RequestStatusEnum[]) {
		return await this.dataSource.getRepository(PaymentUsersMappingRequest).find({
			where: {
				payeeUserId,
				status: In(requestStatus)
			}
		});
	}

	async getParticipantDataForNewParticipant(
		userId: number,
		refdocId: number,
		invitationData: string,
		status: RequestStatusEnum
	) {
		return await this.dataSource.getRepository(ParticipantMapRequest).find({
			where: [
				{ userId, refdocId, mobile: invitationData, status: Not(status) },
				{
					userId,
					refdocId,
					emailId: invitationData,
					status: Not(status)
				}
			]
		});
	}

	async getParticipantDataByIdAndUserId(id: number, userId: number) {
		const participantData = await this.dataSource.getRepository(ParticipantMapRequest).findOne({
			where: {
				id,
				userId,
				status: RequestStatusEnum.NEW_PARTICIPANT
			}
		});
		if (!participantData) {
			throw new HttpException({ status: ResponseData.INVALID_REQUEST_ID }, HttpStatus.OK);
		}
		return participantData;
	}

	async getPaymentUserDataByRefdocId(refdocId: number) {
		return await this.dataSource.getRepository(PaymentUsersMappingRequest).find({
			where: {
				refdocId
			}
		});
	}
}
