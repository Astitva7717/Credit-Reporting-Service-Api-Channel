import { ApproveRefDocDto } from "@modules/doc/dto/approve-ref-doc.dto";
import { GetRefdocDto } from "@modules/doc/dto/getrefdoc.dto";
import { RefdocDetails } from "@modules/doc/entities/refdoc-details.entity";
import { RefdocRejectionReasonMaster } from "@modules/doc/entities/refdoc-rejection-reason-master.entity";
import { RefdocTypeMaster } from "@modules/doc/entities/refdoc-type-master.entity";
import { UserMasterEntity } from "@modules/user-master/entities/user-master.entity";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { RefdocMaster, RefdocMasterStatusEnum } from "src/modules/doc/entities/refdoc-master.entity";
import { RefdocParticipantsMaster, isPrimary } from "src/modules/doc/entities/refdoc-participants-master.entity";
import {
	MasterProofTypeEnum,
	ProofStatus,
	ValidationDocMasterProof
} from "src/modules/doc/entities/validation-doc-master-proof.entity";
import { ValidationDocMonthlyProof } from "@modules/monthly-proof/entities/validation-doc-monthly-proof.entity";
import { DisplayYesNoEnum, MonthlyProofStatusEnum, Status } from "src/utils/enums/Status";
import { ResponseData } from "src/utils/enums/response";
import { DataSource, In, LessThan, Not, QueryRunner } from "typeorm";
import { PaymentSchedule, PaymentScheduleStatus } from "@modules/doc/entities/payment-schedule.entity";
import { PaymentValidationdocMapping } from "@modules/doc/entities/payment-validationdoc-mapping.entity";
import {
	GetAmountApproved,
	GetDueDateForMasterproof,
	GetMasterProofData,
	GetMasterProofDataBackoffice,
	GetMasterProofFilteredData,
	GetPaymentSchedule,
	GetPaymentScheduleByMonthAndYear,
	GetPlaidMasterProofs,
	GetRefdocFullDetailById,
	GetRefdocMasterFilteredData,
	GetRefdocTypes,
	GetRefdocUsersWithUserInfos,
	GetUserRefdocDataAsParticipant,
	GetUsersAllRefdoc,
	GetUsersDataAsPaymentRequested,
	MasterProofDataByRefdocIdsAndStatus,
	PaymentScheduleForRent,
	RefdocDetailsById,
	RefdocParticipantDetails,
	RefdocPrimaryUserDetails,
	TotalMasterProofDocData,
	getMasterProofDataForRefdoc,
	getOlderPaymentSchedule,
	getRefdocHistoryData,
	getRefdocParticipantsByRefdocIds,
	getUserMasterProofDataAsPayeeForRefdoc,
	getUserPaymentScheduleForMonthYearRefdocId,
	getUserPaymentSchedulesBeforeDueDate
} from "@utils/constants/querry-constants";
import { StatusMasterEntity } from "@modules/doc/entities/status-master.entity";
import { RefdocHistory } from "@modules/doc/entities/refdoc-history.entity";
import { RefdocUsersEntity } from "@modules/doc/entities/refdoc-users.entity";
import { UserPaymentSchedule, UserPaymentScheduleStatus } from "@modules/doc/entities/user-payment-schedule.entity";
import { UserTypeEnum } from "@utils/enums/constants";
import { NotSignedOption } from "@modules/doc/entities/not-signed-options.entity";
import { MoneyOrderSource } from "@modules/doc/entities/money-order-sources.entity";
import { LeaseFormats } from "@modules/doc/entities/lease-formats.entity";
import { DropdownOption } from "@modules/doc/entities/dropdown-options.entity";
import { MonthlyProofTypeEnum } from "@utils/enums/txn-types";
import { ParticipantMapRequest } from "@modules/participant/entities/participant-map-request.entity";
import { MonthlyVerifiedProofsEntity } from "@modules/monthly-proof/entities/monthly-proof-verified.entity";
import { PlaidLinkTokens } from "@modules/plaid/entities/plaid-link-tokens.entity";

@Injectable()
export class DocDaoService {
	constructor(private dataSource: DataSource) {}

	async getAllDocMasterProof(userId: number) {
		let docMasterProof = await this.dataSource.getRepository(ValidationDocMasterProof).find({
			where: {
				userId
			}
		});
		if (!docMasterProof || docMasterProof.length === 0) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return docMasterProof;
	}

	async getAllDocMonthlyProof(userId: number, masterProofId: number) {
		let docMonthlyProof = await this.dataSource.getRepository(ValidationDocMonthlyProof).find({
			where: {
				userId,
				masterProofId
			}
		});
		if (!docMonthlyProof || docMonthlyProof.length === 0) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return docMonthlyProof;
	}

	async getRefdocMasterData(refdocId: number, status: RefdocMasterStatusEnum[]) {
		let refdocData = await this.dataSource.getRepository(RefdocMaster).findOne({
			where: {
				refdocId,
				status: In(status)
			}
		});
		if (!refdocData) {
			throw new HttpException({ status: ResponseData.REFDOC_NOT_FOUND }, HttpStatus.OK);
		}
		return refdocData;
	}

	async getRefdocUsersData(refdocId: number, tenantId: number, status: Status) {
		let refdocUsersData = await this.dataSource.getRepository(RefdocUsersEntity).find({
			where: {
				refdocId,
				tenantId,
				status
			}
		});
		if (!refdocUsersData) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return refdocUsersData;
	}

	async getRefdocUsersDataByRefdocId(refdocId: number) {
		let refdocUsersData = await this.dataSource.getRepository(RefdocUsersEntity).find({
			where: {
				refdocId
			}
		});
		if (!refdocUsersData) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return refdocUsersData;
	}

	async getRejectionReasonData(rejectionReasonId: number, status: Status) {
		let rejectionReasonData = await this.dataSource.getRepository(RefdocRejectionReasonMaster).findOne({
			where: {
				id: rejectionReasonId,
				status: status
			}
		});
		if (!rejectionReasonData) {
			throw new HttpException({ status: ResponseData.INVALID_REJECTION_REASON_ID }, HttpStatus.OK);
		}
		return rejectionReasonData;
	}

	async getDocMasterProofDataByIdsAndStatus(ids: number[], status: ProofStatus) {
		let masterProofData = await this.dataSource.getRepository(ValidationDocMasterProof).find({
			where: {
				id: In(ids),
				status
			}
		});
		return masterProofData;
	}

	async saveRefdocMaster(refDocMaster: RefdocMaster) {
		return await this.dataSource.getRepository(RefdocMaster).save(refDocMaster);
	}

	async saveRefdocMasterByQueryRunner(refDocMaster: RefdocMaster, queryRunner: QueryRunner) {
		return await queryRunner.manager.getRepository(RefdocMaster).save(refDocMaster);
	}
	async saveRefdocUsersDataByQueryRunner(refdocUsersData: RefdocUsersEntity, queryRunner: QueryRunner) {
		return await queryRunner.manager.getRepository(RefdocUsersEntity).save(refdocUsersData);
	}

	async saveMultipleRefdocUsersDataByQueryRunner(refdocUsersDataArr: RefdocUsersEntity[], queryRunner: QueryRunner) {
		return await queryRunner.manager.getRepository(RefdocUsersEntity).save(refdocUsersDataArr);
	}

	async saveRefdocHistoryData(refDocMaster: RefdocHistory) {
		return await this.dataSource.getRepository(RefdocHistory).save(refDocMaster);
	}

	async saveRefdocHistoryDataByQueryRunner(refDocMaster: RefdocHistory, queryRunner: QueryRunner) {
		return await queryRunner.manager.getRepository(RefdocHistory).save(refDocMaster);
	}

	async saveMultipleRefdocMastersByQueryRunner(queryRunner: QueryRunner, refDocMaster: RefdocMaster[]) {
		return await queryRunner.manager.getRepository(RefdocMaster).save(refDocMaster);
	}
	async insertMultipleRefdocHistoryDataByQueryRunner(queryRunner: QueryRunner, refDocMaster: RefdocHistory[]) {
		return await queryRunner.manager.getRepository(RefdocHistory).insert(refDocMaster);
	}

	async getRefdocHistoryData(refdocId: number) {
		const whereCondition = {
			refdocId,
			status: Not(In([RefdocMasterStatusEnum.TENANT_DETAILS_PENDING]))
		};
		return await this.dataSource
			.getRepository(RefdocHistory)
			.createQueryBuilder("refdocMasterHistory")
			.innerJoin(StatusMasterEntity, "statusMaster", "refdocMasterHistory.status = statusMaster.status")
			.leftJoin(RefdocRejectionReasonMaster, "reasonMaster", "reasonMaster.id = refdocMasterHistory.rejectedReason")
			.leftJoin(UserMasterEntity, "user", "refdocMasterHistory.verifiedBy = user.userId")
			.select(getRefdocHistoryData)
			.where(whereCondition)
			.orderBy("historyId", "ASC")
			.getRawMany();
	}

	async saveRefdocParticipantDataByQueryRunner(
		refdocParticipantsData: RefdocParticipantsMaster,
		queryRunner: QueryRunner
	) {
		return await queryRunner.manager.getRepository(RefdocParticipantsMaster).save(refdocParticipantsData);
	}

	async verifyRefdocMasterStatus(
		approveRefDocDto: ApproveRefDocDto,
		verifiedBy: number,
		queryRunner: QueryRunner,
		rejectionCount: number
	) {
		let { refdocId, status, remark, rejectedReasonId } = approveRefDocDto;
		rejectionCount = rejectionCount ? +rejectionCount + 1 : 1;
		await queryRunner.manager.getRepository(RefdocMaster).update(
			{ refdocId },
			{
				status,
				remark,
				rejectedReason: rejectedReasonId,
				rejectionCount,
				verifiedBy,
				verifiedAt: new Date(),
				updatedAt: new Date(),
				interimData: null
			}
		);
	}

	async verifyRefdocMasterStatusAndOtherDetails(
		approveRefDocDto: ApproveRefDocDto,
		verifiedBy: number,
		rentDueDate: Date,
		rentPaymentDueDate: Date,
		userId: number,
		queryRunner: QueryRunner
	) {
		let {
			remark,
			refdocId,
			firstName,
			lastName,
			middleName,
			ownerName,
			suffixName,
			propertyName,
			addressOne,
			addressTwo,
			rentDueDay,
			rentPaymentDueDay,
			city,
			state,
			zip,
			validFrom,
			validTo,
			rentAmount,
			baseAmount,
			status,
			variableComponentLease
		} = approveRefDocDto;

		if (!remark) {
			remark = null;
		}
		await queryRunner.manager.getRepository(RefdocMaster).update(
			{ refdocId },
			{
				firstName,
				middleName,
				lastName,
				ownerName,
				suffixName,
				propertyName,
				addressOne,
				addressTwo,
				city,
				state,
				zip,
				validFrom,
				validTo,
				approvedDate: new Date(),
				rentAmount,
				baseAmount,
				verifiedBy,
				verifiedAt: new Date(),
				updatedAt: new Date(),
				remark,
				rentDueDay,
				rentPaymentDueDay,
				status: RefdocMasterStatusEnum[status],
				variableComponentLease,
				rentDueDate,
				rentPaymentDueDate,
				interimData: null
			}
		);
		await queryRunner.manager.getRepository(UserMasterEntity).update(
			{ userId },
			{
				firstName,
				middleName,
				lastName,
				suffixName
			}
		);
	}

	async getRefDocTypes() {
		let refDocTypes = await this.dataSource.getRepository(RefdocTypeMaster).find({
			where: {
				status: Status.ACTIVE
			}
		});
		if (!refDocTypes.length) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return refDocTypes;
	}

	async getRefDocTypeById(refDocTypeId: number) {
		let refDocType = await this.dataSource.getRepository(RefdocTypeMaster).findOne({
			where: {
				refdocTypeId: refDocTypeId,
				status: Status.ACTIVE
			}
		});
		if (!refDocType) {
			throw new HttpException({ status: ResponseData.INVALID_REFDOC_TYPE_ID }, HttpStatus.OK);
		}
		return refDocType;
	}

	async getUserRefdocMasterData(userId: number, refdocId: number) {
		let refDocData = await this.dataSource.getRepository(RefdocMaster).find({
			where: {
				userId,
				refdocId: refdocId
			}
		});
		if (!refDocData.length) {
			throw new HttpException({ status: ResponseData.REFDOC_NOT_FOUND }, HttpStatus.OK);
		}
		return refDocData;
	}

	async getUserAllRefdocMasterDataByRefdocTypes(userId: number, refdocTypeId: number) {
		let refDocData = await this.dataSource.getRepository(RefdocMaster).find({
			where: {
				userId,
				refdocTypeId
			}
		});
		if (!refDocData.length) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return refDocData;
	}

	async getMasterProofFilteredData(refdocId: number) {
		const masterProofs = await this.dataSource
			.getRepository(ValidationDocMasterProof)
			.createQueryBuilder("validationDocMasterProof")
			.innerJoin(UserMasterEntity, "masterUser", "masterUser.userId = validationDocMasterProof.userId")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = validationDocMasterProof.status")
			.innerJoin(UserMasterEntity, "payeeUser", "payeeUser.userId = validationDocMasterProof.payeeId")
			.innerJoin(PaymentValidationdocMapping, "mapping", "mapping.paymentType = validationDocMasterProof.paymentType")
			.leftJoin(
				RefdocRejectionReasonMaster,
				"rejectionReasons",
				"rejectionReasons.id = validationDocMasterProof.rejectedReason"
			)
			.select(GetMasterProofFilteredData)
			.where(`validationDocMasterProof.refdocId = :refdocId`, { refdocId })
			.getRawMany();
		return masterProofs;
	}

	async getMasterProofDataForRefdoc(refdocId: number) {
		const masterProofs = await this.dataSource
			.getRepository(ValidationDocMasterProof)
			.createQueryBuilder("validationDocMasterProof")
			.innerJoin(UserMasterEntity, "masterUser", "masterUser.userId = validationDocMasterProof.userId")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = validationDocMasterProof.status")
			.innerJoin(UserMasterEntity, "payeeUser", "payeeUser.userId = validationDocMasterProof.payeeId")
			.innerJoin(PaymentValidationdocMapping, "mapping", "mapping.paymentType = validationDocMasterProof.paymentType")
			.leftJoin(
				RefdocRejectionReasonMaster,
				"rejectionReasons",
				"rejectionReasons.id = validationDocMasterProof.rejectedReason"
			)
			.select(getMasterProofDataForRefdoc)
			.where(`validationDocMasterProof.refdocId = :refdocId`, { refdocId })
			.getRawMany();
		masterProofs.forEach((masterProof) => (masterProof.proofDetail = JSON.parse(masterProof.proofDetail)));
		return masterProofs;
	}

	async getRefdocMasterFilteredData(body: GetRefdocDto, page: number, limit: number, userIds, refdocIds) {
		if (!page) {
			page = 1;
		}
		if (!limit) {
			limit = 20;
		}
		let offset = (page - 1) * limit;

		let {
			userName,
			userId,
			toValidTill,
			fromValidTill,
			status,
			refdocType,
			documentType,
			name,
			ssnId,
			emailId,
			mobileNo,
			refdocId,
			stateCode,
			userStateCode,
			leaseStateCode,
			pendingManualPaymentsVerification
		} = body;

		let queryBuilder = this.dataSource
			.getRepository(RefdocMaster)
			.createQueryBuilder("refdocMaster")
			.innerJoin(UserMasterEntity, "users", "users.userId = refdocMaster.userId")
			.innerJoin(StatusMasterEntity, "statusMaster", "refdocMaster.status = statusMaster.status")
			.innerJoin(RefdocTypeMaster, "refdocType", "refdocMaster.refdocTypeId = refdocType.refdocTypeId")
			.select(GetRefdocMasterFilteredData)
			.where(`users.status = '${Status.ACTIVE}'`)
			.andWhere(`refdocType.status = '${Status.ACTIVE}'`)
			.andWhere(`(:userName IS NULL OR users.username LIKE :userName)`, { userName: `%${userName || ""}%` })
			.andWhere(`(:emailId IS NULL OR users.emailId = :emailId)`, { emailId })
			.andWhere(`(:ssnId IS NULL OR users.primaryIdValue = :ssnId)`, { ssnId })
			.andWhere(`(:mobileNo IS NULL OR users.mobileNo = :mobileNo)`, { mobileNo })
			.andWhere(`(:name IS NULL OR CONCAT(users.firstName, ' ', users.lastName) LIKE :name)`, {
				name: `%${name || ""}%`
			})
			.andWhere(`(:userId IS NULL OR users.systemUserId = :userId)`, { userId })
			.andWhere(`(:fromValidTill IS NULL OR refdocMaster.validFrom >= :fromValidTill)`, { fromValidTill })
			.andWhere(`(:refdocId IS NULL OR refdocMaster.displayRefdocId = :refdocId)`, { refdocId })
			.andWhere(`(:stateCode IS NULL OR refdocMaster.state = :stateCode)`, { stateCode })
			.andWhere(
				`(:leaseStateCode IS NULL OR refdocMaster.state = :leaseStateCode OR refdocMaster.interimData LIKE :interimStateCode)`,
				{ leaseStateCode, interimStateCode: `%"state":"${leaseStateCode}"%` }
			)
			.andWhere(`(:userStateCode IS NULL OR users.stateCode = :userStateCode)`, { userStateCode })
			.andWhere(`(:toValidTill IS NULL OR refdocMaster.validTo <= :toValidTill)`, { toValidTill })
			.andWhere(`(:refdocType IS NULL OR refdocType.serviceCode = :refdocType)`, { refdocType })
			.andWhere(`(:documentType IS NULL OR refdocType.documentType = :documentType)`, { documentType });
		let refdocStatus = status?.split(",");
		this.handleRefdocStatus(refdocStatus, queryBuilder);

		if (userIds?.length) {
			queryBuilder.andWhere(`refdocMaster.userId IN (:...userIds)`, {
				userIds
			});
		}
		if (pendingManualPaymentsVerification === DisplayYesNoEnum.YES) {
			if (refdocIds?.length) {
				queryBuilder.andWhere(`refdocMaster.refdocId IN (:...refdocIds)`, {
					refdocIds
				});
			} else {
				throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
			}
		} else if (pendingManualPaymentsVerification === DisplayYesNoEnum.NO) {
			queryBuilder.andWhere(`refdocMaster.refdocId NOT IN (:...refdocIds)`, {
				refdocIds
			});
		}

		const total = await queryBuilder.getCount();
		if (offset > total) {
			offset = 0;
		}
		const refDocData = await queryBuilder
			.offset(offset)
			.orderBy("refdocMaster.createdAt", "ASC")
			.limit(limit)
			.getRawMany();
		if (!refDocData || refDocData.length === 0) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return { refDocData, total };
	}

	handleRefdocStatus(refdocStatus, queryBuilder) {
		if (refdocStatus?.length) {
			if (refdocStatus.includes(RefdocMasterStatusEnum.REUPLOADED) && refdocStatus.length == 1) {
				refdocStatus = [];
				refdocStatus.push(RefdocMasterStatusEnum.REQUESTED);
				queryBuilder.andWhere(`(refdocMaster.rejectionCount >= :count)`, { count: 1 });
				queryBuilder.addSelect(`IF(refdocMaster.rejectionCount >= 1, 'Reuploaded', 'Newly Uploaded') AS statusDesc`);
			} else if (refdocStatus.includes(RefdocMasterStatusEnum.NEWLY_UPLOADED) && refdocStatus.length == 1) {
				refdocStatus = [];
				refdocStatus.push(RefdocMasterStatusEnum.REQUESTED);
				queryBuilder.andWhere(`(refdocMaster.rejectionCount = :count)`, { count: 0 });
				queryBuilder.addSelect(`IF(refdocMaster.rejectionCount >= 1, 'Reuploaded', 'Newly Uploaded') AS statusDesc`);
			} else if (
				refdocStatus.includes(RefdocMasterStatusEnum.REUPLOADED) &&
				refdocStatus.includes(RefdocMasterStatusEnum.NEWLY_UPLOADED)
			) {
				refdocStatus = [];
				refdocStatus.push(RefdocMasterStatusEnum.REQUESTED);
				queryBuilder.addSelect(`IF(refdocMaster.rejectionCount >= 1, 'Reuploaded', 'Newly Uploaded') AS statusDesc`);
			}
			queryBuilder.andWhere(`(refdocMaster.status IN (:...status))`, { status: refdocStatus });
		}
	}

	async getUserIdsWithRefdocCount(userType: string) {
		const queryBuilder = this.dataSource
			.getRepository(RefdocMaster)
			.createQueryBuilder("refdocMaster")
			.select(["refdocMaster.userId as userId", "COUNT(refdocMaster.refdocId) as refdocCount"])
			.groupBy("refdocMaster.userId");

		if (userType === UserTypeEnum.NEW_USER) {
			queryBuilder.having(`COUNT(refdocMaster.refdocId) = :count`, { count: 1 });
		} else if (userType === UserTypeEnum.EXISTING_USER) {
			queryBuilder.having(`COUNT(refdocMaster.refdocId) > :count`, { count: 1 });
		}

		return await queryBuilder.getRawMany();
	}

	async getMasterProofDataBackoffice(body: GetRefdocDto, page: number, limit: number) {
		if (!page) {
			page = 1;
		}
		if (!limit) {
			limit = 20;
		}
		let offset = (page - 1) * limit;

		let {
			userName,
			userId,
			toValidTill,
			fromValidTill,
			status,
			refdocType,
			paymentType,
			masterProofValidTill,
			name,
			ssnId,
			emailId,
			mobileNo,
			refdocId
		} = body;

		let queryBuilder = this.dataSource
			.getRepository(ValidationDocMasterProof)
			.createQueryBuilder("validationDocMasterProof")
			.innerJoin(RefdocMaster, "refdocMaster", "validationDocMasterProof.refdocId = refdocMaster.refdocId")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = refdocMaster.status")
			.innerJoin(
				StatusMasterEntity,
				"masterProofStatusMaster",
				"masterProofStatusMaster.status = validationDocMasterProof.status"
			)
			.innerJoin(UserMasterEntity, "users", "users.userId = refdocMaster.userId")
			.innerJoin(RefdocTypeMaster, "refdocType", "refdocMaster.refdocTypeId = refdocType.refdocTypeId")
			.select(GetMasterProofDataBackoffice)
			.andWhere(`(:userName IS NULL OR users.firstName LIKE :userName)`, { userName: `%${userName || ""}%` })
			.andWhere(`(:userId IS NULL OR users.systemUserId = :userId)`, { userId })
			.andWhere(`(:refdocType IS NULL OR refdocType.serviceCode = :refdocType)`, { refdocType })
			.andWhere(`(:fromValidTill IS NULL OR refdocMaster.validFrom >= :fromValidTill)`, { fromValidTill })
			.andWhere(`(:toValidTill IS NULL OR refdocMaster.validTo <= :toValidTill)`, { toValidTill })
			.andWhere(`(:paymentType IS NULL OR validationDocMasterProof.paymentType = :paymentType)`, { paymentType })
			.andWhere(`(:masterProofValidTill IS NULL OR validationDocMasterProof.validTill <= :masterProofValidTill)`, {
				masterProofValidTill
			})
			.andWhere(`(:emailId IS NULL OR users.emailId = :emailId)`, { emailId })
			.andWhere(`(:ssnId IS NULL OR users.primaryIdValue = :ssnId)`, { ssnId })
			.andWhere(`(:mobileNo IS NULL OR users.mobileNo = :mobileNo)`, { mobileNo })
			.andWhere(`(:refdocId IS NULL OR refdocMaster.displayRefdocId = :refdocId)`, { refdocId })
			.andWhere(`(refdocMaster.status = :refdocStatus)`, { refdocStatus: RefdocMasterStatusEnum.APPROVED })
			.andWhere(`(:name IS NULL OR CONCAT(users.firstName, ' ', users.lastName) LIKE :name)`, {
				name: `%${name || ""}%`
			});

		let queryBuilderForCount = this.dataSource
			.getRepository(ValidationDocMasterProof)
			.createQueryBuilder("validationDocMasterProof")
			.innerJoin(RefdocMaster, "refdocMaster", "validationDocMasterProof.refdocId = refdocMaster.refdocId")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = refdocMaster.status")
			.innerJoin(UserMasterEntity, "users", "users.userId = refdocMaster.userId")
			.innerJoin(RefdocTypeMaster, "refdocType", "refdocMaster.refdocTypeId = refdocType.refdocTypeId")
			.select(["refdocMaster.refdocId as refdocId"])
			.andWhere(`(:userName IS NULL OR users.firstName LIKE :userName)`, { userName: `%${userName || ""}%` })
			.andWhere(`(:userId IS NULL OR users.systemUserId = :userId)`, { userId })
			.andWhere(`(:status IS NULL OR validationDocMasterProof.status = :status)`, { status })
			.andWhere(`(:refdocType IS NULL OR refdocType.serviceCode = :refdocType)`, { refdocType })
			.andWhere(`(:fromValidTill IS NULL OR refdocMaster.validFrom >= :fromValidTill)`, { fromValidTill })
			.andWhere(`(:toValidTill IS NULL OR refdocMaster.validTo <= :toValidTill)`, { toValidTill })
			.andWhere(`(:paymentType IS NULL OR validationDocMasterProof.paymentType = :paymentType)`, { paymentType })
			.andWhere(`(:masterProofValidTill IS NULL OR validationDocMasterProof.validTill <= :masterProofValidTill)`, {
				masterProofValidTill
			})
			.andWhere(`(:emailId IS NULL OR users.emailId = :emailId)`, { emailId })
			.andWhere(`(:ssnId IS NULL OR users.primaryIdValue = :ssnId)`, { ssnId })
			.andWhere(`(:mobileNo IS NULL OR users.mobileNo = :mobileNo)`, { mobileNo })
			.andWhere(`(:refdocId IS NULL OR refdocMaster.displayRefdocId = :refdocId)`, { refdocId })
			.andWhere(`(refdocMaster.status = :refdocStatus)`, { refdocStatus: RefdocMasterStatusEnum.APPROVED })
			.andWhere(`(:name IS NULL OR CONCAT(users.firstName, ' ', users.lastName) LIKE :name)`, {
				name: `%${name || ""}%`
			});

		if (status) {
			queryBuilder.addSelect("validationDocMasterProof.status as masterProofStatus");
			queryBuilder.andWhere(`validationDocMasterProof.status = :status`, { status });
		}
		queryBuilder.groupBy("refdocMaster.refdocId, statusMaster.description,masterProofStatusMaster.description");
		queryBuilderForCount.groupBy("refdocMaster.refdocId");
		const totalResults = await queryBuilderForCount.getRawMany();
		const total = totalResults.length;
		const refDocData = await queryBuilder
			.orderBy("refdocMaster.refdocId", "ASC")
			.offset(offset)
			.limit(limit)
			.getRawMany();

		let totalMasterProofDocData = await this.dataSource
			.getRepository(ValidationDocMasterProof)
			.createQueryBuilder("validationDocMasterProof")
			.innerJoin(RefdocMaster, "refdocMaster", "validationDocMasterProof.refdocId = refdocMaster.refdocId")
			.innerJoin(UserMasterEntity, "users", "users.userId = refdocMaster.userId")
			.innerJoin(RefdocTypeMaster, "refdocType", "refdocMaster.refdocTypeId = refdocType.refdocTypeId")
			.select(TotalMasterProofDocData)
			.andWhere(`(:userName IS NULL OR users.firstName LIKE :userName)`, { userName: `%${userName || ""}%` })
			.andWhere(`(:userId IS NULL OR users.systemUserId = :userId)`, { userId })
			.andWhere(`(:refdocType IS NULL OR refdocType.serviceCode = :refdocType)`, { refdocType })
			.andWhere(`(:fromValidTill IS NULL OR refdocMaster.validFrom >= :fromValidTill)`, { fromValidTill })
			.andWhere(`(:toValidTill IS NULL OR refdocMaster.validTo <= :toValidTill)`, { toValidTill })
			.andWhere(`(:paymentType IS NULL OR validationDocMasterProof.paymentType = :paymentType)`, { paymentType })
			.andWhere(`(:masterProofValidTill IS NULL OR validationDocMasterProof.validTill <= :masterProofValidTill)`, {
				masterProofValidTill
			})
			.andWhere(`(:emailId IS NULL OR users.emailId = :emailId)`, { emailId })
			.andWhere(`(:ssnId IS NULL OR users.primaryIdValue = :ssnId)`, { ssnId })
			.andWhere(`(:mobileNo IS NULL OR users.mobileNo = :mobileNo)`, { mobileNo })
			.andWhere(`(:refdocId IS NULL OR refdocMaster.displayRefdocId = :refdocId)`, { refdocId })
			.andWhere(`(refdocMaster.status = :refdocStatus)`, { refdocStatus: RefdocMasterStatusEnum.APPROVED })
			.andWhere(`(:name IS NULL OR CONCAT(users.firstName, ' ', users.lastName) LIKE :name)`, {
				name: `%${name || ""}%`
			})
			.groupBy("refdocMaster.refdocId")
			.offset(offset)
			.limit(limit)
			.getRawMany();
		const refdocIdToData: Map<string, string> = new Map();
		totalMasterProofDocData.forEach((data) => {
			refdocIdToData.set(data.refdocId, data.validationDocCount);
		});
		if (!refDocData || refDocData.length === 0) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return { refDocData, total, refdocIdToData };
	}

	async getUserValidationDocMasterProofByProofIdValueMasterProofType(
		userId: number,
		proofIdValue: string,
		masterProofType: MasterProofTypeEnum
	) {
		let docMasterProof = await this.dataSource.getRepository(ValidationDocMasterProof).findOne({
			where: {
				userId,
				status: ProofStatus.APPROVED,
				masterProofType,
				proofIdValue
			}
		});
		if (!docMasterProof) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return docMasterProof;
	}

	async updateValidationDocMasterProofStatusForRefdoc(refdocId: number, userId: number, status: ProofStatus) {
		await this.dataSource
			.getRepository(ValidationDocMasterProof)
			.update({ userId, refdocId }, { status, updatedAt: new Date() });
	}

	async getRefdocParticipantDataByUser(refdocId: number, userId: number, status: Status) {
		let refdocParticipantData = await this.dataSource.getRepository(RefdocParticipantsMaster).findOne({
			where: {
				refdocId,
				userId,
				status
			}
		});
		if (!refdocParticipantData) {
			throw new HttpException({ status: ResponseData.INVALID_REFDOC_ID }, HttpStatus.OK);
		}
		return refdocParticipantData;
	}

	async getRefdocParticipantDataByUserRefdocIdAndStatus(refdocId: number, userId: number, status: Status) {
		return await this.dataSource.getRepository(RefdocParticipantsMaster).findOne({
			where: {
				refdocId,
				userId,
				status
			}
		});
	}

	async getUserRefdocMasterDataByRefdoc(userId: number, refdocId: number) {
		let refDocData = await this.dataSource.getRepository(RefdocMaster).findOne({
			where: {
				userId,
				refdocId: refdocId
			}
		});
		if (!refDocData) {
			throw new HttpException({ status: ResponseData.REFDOC_NOT_FOUND }, HttpStatus.OK);
		}
		return refDocData;
	}

	async updateRefdocDetails(refdocData: RefdocMaster, queryRunner: QueryRunner) {
		return await queryRunner.manager.getRepository(RefdocMaster).save(refdocData);
	}

	async updateParticipantCbReportingStatus(
		refdocId: number,
		userId: number,
		newCbReportingStatus: isPrimary,
		queryRunner: QueryRunner
	) {
		await queryRunner.manager
			.getRepository(RefdocParticipantsMaster)
			.update({ userId, refdocId }, { cbReportingAllowed: newCbReportingStatus, updatedAt: new Date() });
	}

	async getUsersAllRefdocs(userId: number) {
		let whereCondition = {
			userId
		};
		let refDocData = await this.dataSource
			.getRepository(RefdocMaster)
			.createQueryBuilder("refdocMaster")
			.innerJoin(RefdocTypeMaster, "refdocTypeMaster", "refdocTypeMaster.refdocTypeId = refdocMaster.refdocTypeId")
			.innerJoin(UserMasterEntity, "user", "user.userId = refdocMaster.userId")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = refdocMaster.status")
			.leftJoin(RefdocRejectionReasonMaster, "rejectionReasons", "rejectionReasons.id = refdocMaster.rejectedReason")
			.select(GetUsersAllRefdoc)
			.where(whereCondition)
			.getRawMany();
		return refDocData;
	}

	async getUserRefdocDataAsParticipant(userId: number) {
		let whereCondition = {
			userId,
			isPrimary: isPrimary.N,
			status: Status.ACTIVE
		};
		let participantsData = await this.dataSource
			.getRepository(RefdocParticipantsMaster)
			.createQueryBuilder("participantMaster")
			.innerJoin(RefdocMaster, "refdocMaster", "refdocMaster.refdocId = participantMaster.refdocId")
			.innerJoin(RefdocTypeMaster, "refdocTypeMaster", "refdocTypeMaster.refdocTypeId = refdocMaster.refdocTypeId")
			.innerJoin(UserMasterEntity, "user", "user.userId = refdocMaster.userId")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = refdocMaster.status")
			.leftJoin(RefdocRejectionReasonMaster, "rejectionReasons", "rejectionReasons.id = refdocMaster.rejectedReason")
			.select(GetUserRefdocDataAsParticipant)
			.where(whereCondition)
			.getRawMany();
		return participantsData;
	}

	async getUsersDataAsPaymentRequested(refdocIds: number[]) {
		let refDocData = await this.dataSource
			.getRepository(RefdocMaster)
			.createQueryBuilder("refdocMaster")
			.innerJoin(RefdocTypeMaster, "refdocTypeMaster", "refdocTypeMaster.refdocTypeId = refdocMaster.refdocTypeId")
			.innerJoin(UserMasterEntity, "user", "user.userId = refdocMaster.userId")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = refdocMaster.status")
			.leftJoin(RefdocRejectionReasonMaster, "rejectionReasons", "rejectionReasons.id = refdocMaster.rejectedReason")
			.select(GetUsersDataAsPaymentRequested)
			.where({
				refdocId: In(refdocIds)
			})
			.getRawMany();
		return refDocData;
	}

	async saveValidationDocMasterData(validationDocMasterData: ValidationDocMasterProof) {
		await this.dataSource.getRepository(ValidationDocMasterProof).save(validationDocMasterData);
	}

	async saveMasterProofs(validationDocMasterData: ValidationDocMasterProof[]) {
		await this.dataSource.getRepository(ValidationDocMasterProof).save(validationDocMasterData);
	}

	async saveValidationDocMasterDataByQueryRunner(
		validationDocMasterData: ValidationDocMasterProof,
		queryRunner: QueryRunner
	) {
		await queryRunner.manager.getRepository(ValidationDocMasterProof).save(validationDocMasterData);
	}

	async getRefdocRejectionReasons() {
		let reasons = await this.dataSource.getRepository(RefdocRejectionReasonMaster).find({
			where: {
				status: Status.ACTIVE
			}
		});
		if (!reasons.length) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return reasons;
	}

	async getNotSignedOptions() {
		let options = await this.dataSource.getRepository(NotSignedOption).find({
			where: {
				status: Status.ACTIVE
			}
		});
		if (!options.length) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return options;
	}

	async getMoneyOrderSources() {
		let sources = await this.dataSource.getRepository(MoneyOrderSource).find({
			where: {
				status: Status.ACTIVE
			}
		});
		if (!sources.length) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return sources;
	}

	async getLeaseFormats() {
		let formats = await this.dataSource.getRepository(LeaseFormats).find({
			where: {
				status: Status.ACTIVE
			}
		});
		if (!formats.length) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return formats;
	}
	async saveRefdocDetails(refdocDetails: RefdocDetails[], queryRunner: QueryRunner) {
		await queryRunner.manager.getRepository(RefdocDetails).save(refdocDetails);
	}

	async getMasterProofDataByIdAndStatus(masterProofId: number, status: ProofStatus) {
		let docMasterProof = await this.dataSource.getRepository(ValidationDocMasterProof).findOne({
			where: {
				id: masterProofId,
				status
			}
		});
		if (!docMasterProof) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return docMasterProof;
	}

	async getMasterProofDataByRefdocIdsAndStatus(refdocIds: number[], status: ProofStatus) {
		return await this.dataSource
			.getRepository(ValidationDocMasterProof)
			.createQueryBuilder("masterproof")
			.innerJoin(PaymentValidationdocMapping, "mapping", "mapping.paymentType = masterproof.paymentType")
			.select(MasterProofDataByRefdocIdsAndStatus)
			.where({
				status,
				refdocId: In(refdocIds)
			})
			.getRawMany();
	}

	async getMasterProofDataByRefdocIdAndMasterProofType(
		refdocId: number,
		status: ProofStatus,
		masterProofType: MasterProofTypeEnum
	) {
		return await this.dataSource
			.getRepository(ValidationDocMasterProof)
			.createQueryBuilder("masterproof")
			.innerJoin(PaymentValidationdocMapping, "mapping", "mapping.paymentType = masterproof.paymentType")
			.select(MasterProofDataByRefdocIdsAndStatus)
			.where({
				status,
				refdocId,
				masterProofType
			})
			.getRawMany();
	}

	async getMasterProofDataByRefdocIdsAndMasterProofType(
		refdocIds: number[],
		status: ProofStatus,
		masterProofType: MasterProofTypeEnum
	) {
		return await this.dataSource
			.getRepository(ValidationDocMasterProof)
			.createQueryBuilder("masterproof")
			.innerJoin(PaymentValidationdocMapping, "mapping", "mapping.paymentType = masterproof.paymentType")
			.select(MasterProofDataByRefdocIdsAndStatus)
			.where({
				status,
				refdocId: In(refdocIds),
				masterProofType
			})
			.getRawMany();
	}

	async getRefdocPrimaryUserDetails(refdocId: number) {
		let whereCondition = {
			refdocId
		};
		return await this.dataSource
			.getRepository(RefdocMaster)
			.createQueryBuilder("refdocMaster")
			.innerJoin(UserMasterEntity, "users", "users.userId = refdocMaster.userId")
			.select(RefdocPrimaryUserDetails)
			.where(whereCondition)
			.getRawOne();
	}

	async getMasterProofData(refdocId: number, payeeId: number) {
		return await this.dataSource
			.getRepository(ValidationDocMasterProof)
			.createQueryBuilder("proof")
			.innerJoin(PaymentValidationdocMapping, "mapping", "mapping.paymentType = proof.paymentType")
			.innerJoin(StatusMasterEntity, "statusMaster", "proof.status = statusMaster.status")
			.leftJoin(RefdocRejectionReasonMaster, "rejectionReasons", "rejectionReasons.id = proof.rejectedReason")
			.select(GetMasterProofData)
			.where("proof.refdocId = :refdocId", { refdocId })
			.andWhere("proof.payeeId = :payeeId", { payeeId })
			.orderBy("proof.updatedAt", "DESC")
			.getRawMany();
	}

	async getMasterProofDataAndPaymentDocMapping(masterProofId: number) {
		const data = await this.dataSource
			.getRepository(ValidationDocMasterProof)
			.createQueryBuilder("proof")
			.innerJoin(PaymentValidationdocMapping, "mapping", "mapping.paymentType = proof.paymentType")
			.select(["proof", "mapping.monthlyProofType as monthlyProofType"])
			.where("proof.id = :masterProofId", { masterProofId })
			.getRawOne();
		if (!data) {
			throw new HttpException({ status: ResponseData.INVALID_MASTER_PROOF_ID }, HttpStatus.OK);
		}
		return data;
	}

	async getRefdocById(refdocId: number) {
		return await this.dataSource.getRepository(RefdocMaster).findOne({
			where: {
				refdocId
			}
		});
	}

	async getRefdocByQueryRunner(queryRunner: QueryRunner, refdocId: number) {
		return await queryRunner.manager.getRepository(RefdocMaster).findOne({
			where: {
				refdocId
			}
		});
	}

	async getRefdocDetailsById(refdocId: number) {
		let whereCondition = {
			refdocId
		};
		let data = await this.dataSource
			.getRepository(RefdocMaster)
			.createQueryBuilder("refdocMaster")
			.innerJoin(UserMasterEntity, "users", "users.userId = refdocMaster.userId")
			.innerJoin(StatusMasterEntity, "statusMaster", "refdocMaster.status = statusMaster.status")
			.innerJoin(RefdocTypeMaster, "refdocType", "refdocMaster.refdocTypeId = refdocType.refdocTypeId")
			.leftJoin(RefdocRejectionReasonMaster, "rejectionReasons", "rejectionReasons.id = refdocMaster.rejectedReason")
			.select(RefdocDetailsById)
			.where(whereCondition)
			.getRawOne();

		if (!data) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return data;
	}

	async getRefdocParticipantsDetails(refdocId: number) {
		let whereCondition = {
			refdocId
		};
		return await this.dataSource
			.getRepository(RefdocParticipantsMaster)
			.createQueryBuilder("refdocParticipants")
			.innerJoin(UserMasterEntity, "users", "users.userId = refdocParticipants.userId")
			.select(RefdocParticipantDetails)
			.where(whereCondition)
			.getRawMany();
	}

	async getMasterProofById(masterProofId: number, refdocId: number) {
		const masterProof = await this.dataSource.getRepository(ValidationDocMasterProof).findOne({
			where: {
				id: masterProofId,
				refdocId
			}
		});
		if (!masterProof) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return masterProof;
	}

	async getMasterProofByUserRefdocMasterProofTypeAndStatus(
		userId: number,
		refdocId: number,
		masterProofType: MasterProofTypeEnum,
		status: ProofStatus
	) {
		return await this.dataSource.getRepository(ValidationDocMasterProof).find({
			where: {
				userId,
				masterProofType,
				refdocId,
				status
			}
		});
	}

	async getMasterProofByMasterProofId(masterProofId: number) {
		const masterProof = await this.dataSource.getRepository(ValidationDocMasterProof).findOne({
			where: {
				id: masterProofId
			}
		});
		if (!masterProof) {
			throw new HttpException({ status: ResponseData.MASTERPROOF_NOT_FOUND }, HttpStatus.OK);
		}
		return masterProof;
	}

	async getRefdocDataByRefdocIds(refdocIds: number[]) {
		return await this.dataSource.getRepository(RefdocMaster).find({
			where: {
				refdocId: In(refdocIds)
			}
		});
	}

	async getRefdocExtraDetailsByIds(refdocIds: number[]) {
		return await this.dataSource.getRepository(RefdocDetails).find({
			where: {
				refdocId: In(refdocIds)
			}
		});
	}

	async getRefdocExtraDetailsById(refdocId: number) {
		return await this.dataSource.getRepository(RefdocDetails).find({
			where: {
				refdocId
			}
		});
	}

	async getMasterProofByRefdocIdAndStatus(refdocId: number, status: ProofStatus) {
		return await this.dataSource.getRepository(ValidationDocMasterProof).find({
			where: {
				refdocId,
				status
			}
		});
	}

	async updateRefdocStatus(refdocId: number, status: RefdocMasterStatusEnum) {
		await this.dataSource.getRepository(RefdocMaster).update(
			{ refdocId },
			{
				status,
				updatedAt: new Date()
			}
		);
	}

	async getRefdocMasterByUserIdRefdocIdAndStatus(refdocId: number, userId: number, status: RefdocMasterStatusEnum) {
		const refdoc = await this.dataSource.getRepository(RefdocMaster).findOne({
			where: {
				refdocId,
				userId,
				status
			}
		});
		if (!refdoc) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return refdoc;
	}

	async getMasterProofByIdandStatus(masterProofId: number, status: ProofStatus) {
		const masterProof = await this.dataSource.getRepository(ValidationDocMasterProof).findOne({
			where: {
				id: masterProofId,
				status
			}
		});
		if (!masterProof) {
			throw new HttpException({ status: ResponseData.INVALID_MASTERPROOF }, HttpStatus.OK);
		}
		return masterProof;
	}

	async getUserPaymentScheduleById(ids: number[], queryRunner: QueryRunner) {
		const paymentSchedule = await queryRunner.manager.getRepository(UserPaymentSchedule).find({
			where: {
				id: In(ids)
			}
		});

		return paymentSchedule;
	}

	async getUserPaymentSchedulesByRefScheduleId(refScheduleId: number, queryRunner: QueryRunner) {
		return await queryRunner.manager.getRepository(UserPaymentSchedule).find({
			where: {
				refScheduleId
			}
		});
	}

	async getUserPaymentScheduleByRefScheduleIdAndUserId(userId: number, refScheduleId: number, queryRunner: QueryRunner) {
		return await queryRunner.manager.getRepository(UserPaymentSchedule).findOne({
			where: {
				userId,
				refScheduleId
			}
		});
	}

	async getUserPaymentScheduleForMonthYearRefdocIdAndStatus(
		month: string,
		year: number,
		userId: number,
		refdocId: number,
		queryRunner: QueryRunner,
		status?: UserPaymentScheduleStatus
	) {
		return await queryRunner.manager
			.getRepository(UserPaymentSchedule)
			.createQueryBuilder("userPaymentSchedule")
			.innerJoin(PaymentSchedule, "paymentSchedule", "userPaymentSchedule.refScheduleId = paymentSchedule.id")
			.select(getUserPaymentScheduleForMonthYearRefdocId)
			.where(`userPaymentSchedule.userId = :userId`, { userId })
			.andWhere(`userPaymentSchedule.month = :month`, { month })
			.andWhere(`userPaymentSchedule.year = :year`, { year })
			.andWhere(`(:status IS NULL OR userPaymentSchedule.status = :status)`, { status })
			.andWhere(`paymentSchedule.leaseId = :leaseId`, { leaseId: refdocId })
			.getRawOne();
	}

	async getUserPaymentScheduleForMonthYearRefdocId(
		month: string,
		year: number,
		userId: number,
		refdocId: number,
		queryRunner: QueryRunner
	) {
		return await queryRunner.manager
			.getRepository(UserPaymentSchedule)
			.createQueryBuilder("userPaymentSchedule")
			.innerJoin(PaymentSchedule, "paymentSchedule", "userPaymentSchedule.refScheduleId = paymentSchedule.id")
			.select(getUserPaymentScheduleForMonthYearRefdocId)
			.where(`userPaymentSchedule.userId = :userId`, { userId })
			.andWhere(`userPaymentSchedule.month = :month`, { month })
			.andWhere(`userPaymentSchedule.year = :year`, { year })
			.andWhere(`paymentSchedule.leaseId = :leaseId`, { leaseId: refdocId })
			.getRawOne();
	}

	async getUserPaymentSchedulesBeforeDueDate(userId: number, refdocId: number, dueDate: string) {
		return await this.dataSource
			.getRepository(UserPaymentSchedule)
			.createQueryBuilder("userPaymentSchedule")
			.innerJoin(PaymentSchedule, "paymentSchedule", "userPaymentSchedule.refScheduleId = paymentSchedule.id")
			.select(getUserPaymentSchedulesBeforeDueDate)
			.where(`userPaymentSchedule.userId = :userId`, { userId })
			.andWhere(`paymentSchedule.leaseId = :leaseId`, { leaseId: refdocId })
			.andWhere(`paymentSchedule.dueDate < :dueDate`, { dueDate })
			.getRawMany();
	}

	async getPaymentSchedule(refdocIds: number[]) {
		const paymentSchedule = await this.dataSource
			.getRepository(PaymentSchedule)
			.createQueryBuilder("paymentSchedule")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = paymentSchedule.status")
			.select(GetPaymentSchedule)
			.where("paymentSchedule.leaseId IN (:...refdocIds)", { refdocIds })
			.getRawMany();

		return paymentSchedule;
	}

	async getPaymentScheduleByStatus(refdocIds: number[], statusArr: PaymentScheduleStatus[]) {
		const paymentSchedule = await this.dataSource
			.getRepository(PaymentSchedule)
			.createQueryBuilder("paymentSchedule")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = paymentSchedule.status")
			.select(GetPaymentSchedule)
			.where("paymentSchedule.leaseId IN (:...refdocIds)", { refdocIds })
			.andWhere("paymentSchedule.status IN (:...statusArr)", { statusArr })
			.getRawMany();

		return paymentSchedule;
	}

	async getPaymentScheduleByScheduleId(scheduleId: number) {
		return await this.dataSource.getRepository(PaymentSchedule).findOne({
			where: {
				id: scheduleId
			}
		});
	}
	async getPaymentScheduleByRefdocId(refdocId: number) {
		const paymentSchedule = await this.dataSource
			.getRepository(PaymentSchedule)
			.createQueryBuilder("paymentSchedule")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = paymentSchedule.status")
			.select(GetPaymentSchedule)
			.where("paymentSchedule.leaseId = :refdocId", { refdocId })
			.orderBy("paymentSchedule.id", "ASC")
			.getRawMany();
		return paymentSchedule;
	}

	async getPaymentScheduleDataByRefdocId(refdocId: number) {
		return await this.dataSource.getRepository(PaymentSchedule).find({
			where: {
				leaseId: refdocId
			}
		});
	}

	async getOlderPaymentSchedule(refdocId: number, endDate: string, benificiaryUserId: number) {
		return await this.dataSource
			.getRepository(PaymentSchedule)
			.createQueryBuilder("paymentSchedule")
			.innerJoin(UserPaymentSchedule, "userPaymentSchedule", "userPaymentSchedule.refScheduleId = paymentSchedule.id")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = userPaymentSchedule.status")
			.select(getOlderPaymentSchedule)
			.where("paymentSchedule.leaseId = :refdocId", { refdocId })
			.andWhere("(paymentSchedule.dueDate <= :endDate)", { endDate })
			.andWhere("(userPaymentSchedule.userId = :userId)", { userId: benificiaryUserId })
			.orderBy("paymentSchedule.dueDate", "DESC")
			.getRawMany();
	}

	async getPaymentScheduleForRentDueData(fromDate: string, toDate: string, status: PaymentScheduleStatus) {
		return await this.dataSource
			.getRepository(PaymentSchedule)
			.createQueryBuilder("PaymentSchedule")
			.innerJoin(RefdocMaster, "refdoc", "refdoc.refdocId = PaymentSchedule.leaseId")
			.select(PaymentScheduleForRent)
			.where(`PaymentSchedule.dueDate >= :fromDate`, { fromDate })
			.andWhere(`PaymentSchedule.dueDate <= :toDate`, { toDate })
			.andWhere(`PaymentSchedule.status = :status`, { status })
			.andWhere(`refdoc.status = :refdocStatus`, { refdocStatus: RefdocMasterStatusEnum.APPROVED })
			.getRawMany();
	}

	async savePaymentSchedule(paymentSchedule: PaymentSchedule[], queryRunner: QueryRunner) {
		return await queryRunner.manager.getRepository(PaymentSchedule).save(paymentSchedule);
	}

	async getPaymentScheduleByMonthYearAndRefdoc(refdocId: number, month: string, year: number) {
		const paymentSchedule = await this.dataSource.getRepository(PaymentSchedule).findOne({
			where: {
				leaseId: refdocId,
				month,
				year
			}
		});

		return paymentSchedule;
	}

	async getPaymentScheduleByMonthYearAndRefdocId(refdocId: number, month: string, year: number) {
		const paymentSchedule = await this.dataSource
			.getRepository(PaymentSchedule)
			.createQueryBuilder("paymentSchedule")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = paymentSchedule.status")
			.select(GetPaymentScheduleByMonthAndYear)
			.where("paymentSchedule.leaseId = :refdocId", { refdocId })
			.andWhere("paymentSchedule.month = :month", { month })
			.andWhere("paymentSchedule.year = :year", { year })
			.getRawOne();
		return paymentSchedule;
	}

	async saveUserPaymentScheduleByQueryRunner(userPaymentSchedules: UserPaymentSchedule[], queryRunner: QueryRunner) {
		return await queryRunner.manager.getRepository(UserPaymentSchedule).save(userPaymentSchedules);
	}

	async updateUserPaymentScheduleByRefScheduleIds(
		refScheduleId: number[],
		status: UserPaymentScheduleStatus,
		queryRunner: QueryRunner
	) {
		return await queryRunner.manager
			.getRepository(UserPaymentSchedule)
			.createQueryBuilder()
			.update()
			.set({ status, updatedAt: new Date() })
			.where(`refScheduleId In (:...refScheduleId)`, { refScheduleId })
			.execute();
	}

	async updateUserPaymentScheduleByRefScheduleId(
		refScheduleId: number,
		status: UserPaymentScheduleStatus,
		queryRunner: QueryRunner
	) {
		return await queryRunner.manager
			.getRepository(UserPaymentSchedule)
			.createQueryBuilder()
			.update()
			.set({ status, updatedAt: new Date() })
			.where(`refScheduleId = :refScheduleId`, { refScheduleId })
			.execute();
	}

	async updateUserPaymentScheduleByIds(ids: number[], status: UserPaymentScheduleStatus, queryRunner: QueryRunner) {
		return await queryRunner.manager
			.getRepository(UserPaymentSchedule)
			.createQueryBuilder()
			.update()
			.set({ status, updatedAt: new Date() })
			.where(`id In (:...ids)`, { ids })
			.execute();
	}

	async saveMultipleRefdocMaster(refDocMaster: RefdocMaster[]) {
		return await this.dataSource.getRepository(RefdocMaster).save(refDocMaster);
	}

	async getMasterProofsByUserIdAndRefdocId(refdocId: number, userId: number) {
		return await this.dataSource.getRepository(ValidationDocMasterProof).find({
			select: { id: true, status: true },
			where: {
				refdocId,
				userId
			}
		});
	}

	async getMasterProofsByPayeeIdAndRefdocId(payeeId: number, refdocId: number) {
		return await this.dataSource.getRepository(ValidationDocMasterProof).find({
			select: { id: true, status: true },
			where: {
				refdocId,
				payeeId
			}
		});
	}

	async getMasterProofsByRefdocIds(refdocIds: number[]) {
		return await this.dataSource.getRepository(ValidationDocMasterProof).find({
			where: {
				refdocId: In(refdocIds)
			}
		});
	}

	async getRefdocsByValidToAnsStatus(validTo: Date, status: RefdocMasterStatusEnum) {
		return await this.dataSource.getRepository(RefdocMaster).find({
			where: {
				validTo: LessThan(validTo),
				status
			}
		});
	}

	async getDueDateForMasterproof(masterProofId: number, fromDate: Date, toDate: Date) {
		return await this.dataSource
			.getRepository(ValidationDocMasterProof)
			.createQueryBuilder("masterProof")
			.innerJoin(PaymentSchedule, "schedule", "schedule.leaseId = masterProof.refdocId")
			.innerJoin(PaymentValidationdocMapping, "mapping", "mapping.paymentType = masterProof.paymentType")
			.select(GetDueDateForMasterproof)
			.where(`schedule.dueDate >= :fromDate`, { fromDate })
			.andWhere(`schedule.dueDate <= :toDate`, { toDate })
			.andWhere(`masterProof.id = :masterProofId`, { masterProofId })
			.getRawOne();
	}

	async getMasterProofWithPaymentValidationDocByRefdocIdAndUserId(refdocId: number, userId: number) {
		return await this.dataSource
			.getRepository(ValidationDocMasterProof)
			.createQueryBuilder("masterProof")
			.innerJoin(PaymentValidationdocMapping, "mapping", "mapping.paymentType = masterProof.paymentType")
			.select(GetDueDateForMasterproof)
			.andWhere(`masterProof.refdocId = :refdocId`, { refdocId })
			.andWhere(`masterProof.userId = :userId`, { userId })
			.getRawMany();
	}

	async getMasterProofsByPayeeIdMasterProofIdAndStatus(masterProofId: number, payeeId: number, status: ProofStatus) {
		const masterProof = await this.dataSource.getRepository(ValidationDocMasterProof).findOne({
			where: {
				id: masterProofId,
				payeeId,
				status
			}
		});
		if (!masterProof) {
			throw new HttpException({ status: ResponseData.INVALID_MASTERPROOF }, HttpStatus.OK);
		}
		return masterProof;
	}

	async getRefdocTypes(refdocIds: number[]) {
		let whereCondition = {
			refdocId: In(refdocIds)
		};
		let refDocData = await this.dataSource
			.getRepository(RefdocMaster)
			.createQueryBuilder("refdocMaster")
			.innerJoin(RefdocTypeMaster, "refdocTypeMaster", "refdocTypeMaster.refdocTypeId = refdocMaster.refdocTypeId")
			.select(GetRefdocTypes)
			.where(whereCondition)
			.getRawMany();
		return refDocData;
	}

	async getMasterProofsDetailsRelatedToUser(userId: number) {
		return await this.dataSource.getRepository(ValidationDocMasterProof).find({
			where: [{ userId }, { payeeId: userId }]
		});
	}

	async getUserMasterProofsByRefdocIds(refdocIds: number[], userId: number) {
		return await this.dataSource.getRepository(ValidationDocMasterProof).find({
			where: {
				userId,
				refdocId: In(refdocIds)
			},
			select: {
				id: true,
				refdocId: true,
				createdAt: true
			}
		});
	}

	async getRefdocParticipantsDataByUserId(userId: number) {
		return await this.dataSource
			.getRepository(RefdocMaster)
			.createQueryBuilder("refdocMaster")
			.innerJoin(RefdocParticipantsMaster, "refdocParticipants", "refdocMaster.refdocId = refdocParticipants.refdocId")
			.innerJoin(RefdocTypeMaster, "refdocType", "refdocMaster.refdocTypeId = refdocType.refdocTypeId")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = refdocMaster.status")
			.select(getRefdocParticipantsByRefdocIds)
			.where("refdocParticipants.userId = :userId", { userId })
			.andWhere("refdocParticipants.status = :status", { status: Status.ACTIVE })
			.getRawMany();
	}

	async getUserMasterProofDataAsPayeeForRefdoc(refdocId: number, payeeId: number, status: ProofStatus) {
		const whereCondition = {
			refdocId,
			payeeId,
			status
		};
		return await this.dataSource
			.getRepository(ValidationDocMasterProof)
			.createQueryBuilder("masterProof")
			.innerJoin(PaymentValidationdocMapping, "mapping", "mapping.paymentType = masterProof.paymentType")
			.select(getUserMasterProofDataAsPayeeForRefdoc)
			.where(whereCondition)
			.getRawMany();
	}

	async getAmountApprovedByrefdocId(refdocId: number, monthArr, yearArr) {
		return await this.dataSource
			.getRepository(ValidationDocMasterProof)
			.createQueryBuilder("masterProof")
			.innerJoin(MonthlyVerifiedProofsEntity, "verifiedProofs", "verifiedProofs.masterProofId = masterProof.id")
			.innerJoin(PaymentValidationdocMapping, "paymentMapping", "paymentMapping.paymentType = masterProof.paymentType")
			.innerJoin(UserMasterEntity, "tenantUser", "tenantUser.userId = masterProof.userId")
			.innerJoin(UserMasterEntity, "payeeUser", "payeeUser.userId = masterProof.payeeId")
			.select(GetAmountApproved)
			.where("masterProof.refdocId = :refdocId", { refdocId })
			.andWhere("verifiedProofs.reportingMonth IN (:...monthArr)", { monthArr })
			.andWhere("verifiedProofs.reportingYear IN (:...yearArr)", { yearArr })
			.andWhere("verifiedProofs.status = :status", { status: MonthlyProofStatusEnum.APPROVED })
			.getRawMany();
	}

	async getRefdocUsersWithUserInfos(refdocId: number, tenantId: number, status: Status) {
		return await this.dataSource
			.getRepository(RefdocUsersEntity)
			.createQueryBuilder("refdocUsers")
			.leftJoin(UserMasterEntity, "paydocUser", "paydocUser.userId = refdocUsers.paydocUserId")
			.leftJoin(UserMasterEntity, "veridocUser", "veridocUser.userId = refdocUsers.veridocUserId")
			.select(GetRefdocUsersWithUserInfos)
			.where("refdocUsers.refdocId = :refdocId", { refdocId })
			.andWhere("refdocUsers.tenantId = :tenantId", { tenantId })
			.andWhere("refdocUsers.status = :status", { status })
			.getRawMany();
	}

	async getPaymentTypeNameByPaymentType(paymentType: string) {
		const paymentTypeData = await this.dataSource
			.getRepository(PaymentValidationdocMapping)
			.createQueryBuilder("mapping")
			.select("mapping.paymentTypeName as docTypeName")
			.where("mapping.paymentType = :paymentType", { paymentType })
			.getRawOne();
		if (!paymentTypeData) {
			throw new HttpException({ status: ResponseData.INVALID_PAYMENT_TYPE }, HttpStatus.OK);
		}
		return paymentTypeData;
	}

	async getRefdocTypeByRefdocId(refdocId: number) {
		const refdocTypeData = await this.dataSource
			.getRepository(RefdocTypeMaster)
			.createQueryBuilder("refdocType")
			.innerJoin(RefdocMaster, "refdoc", "refdoc.refdocTypeId = refdocType.refdocTypeId")
			.select("refdocType.name as refdocType")
			.where("refdoc.refdocId = :refdocId", { refdocId })
			.getRawOne();
		if (!refdocTypeData) {
			throw new HttpException({ status: ResponseData.INVALID_REFDOC_ID }, HttpStatus.OK);
		}
		return refdocTypeData;
	}

	async getRefdocTypeByMasterProofId(masterProofId: number) {
		const refdocTypeData = await this.dataSource
			.getRepository(RefdocTypeMaster)
			.createQueryBuilder("refdocType")
			.innerJoin(RefdocMaster, "refdoc", "refdoc.refdocTypeId = refdocType.refdocTypeId")
			.innerJoin(ValidationDocMasterProof, "masterProof", "masterProof.refdocId = refdoc.refdocId")
			.select("refdocType.name as refdocType")
			.where("masterProof.id = :masterProofId", { masterProofId })
			.getRawOne();
		if (!refdocTypeData) {
			throw new HttpException({ status: ResponseData.INVALID_MASTER_PROOF_ID }, HttpStatus.OK);
		}
		return refdocTypeData;
	}

	async getRefdocFullDetailById(refdocId: number) {
		let whereCondition = {
			refdocId
		};
		let refDocData = await this.dataSource
			.getRepository(RefdocMaster)
			.createQueryBuilder("refdocMaster")
			.innerJoin(RefdocTypeMaster, "refdocTypeMaster", "refdocTypeMaster.refdocTypeId = refdocMaster.refdocTypeId")
			.innerJoin(UserMasterEntity, "user", "user.userId = refdocMaster.userId")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = refdocMaster.status")
			.leftJoin(RefdocRejectionReasonMaster, "rejectionReasons", "rejectionReasons.id = refdocMaster.rejectedReason")
			.select(GetRefdocFullDetailById)
			.where(whereCondition)
			.getRawOne();
		return refDocData;
	}

	async getStatusDisplayName(status) {
		const statusData = await this.dataSource.getRepository(StatusMasterEntity).findOne({ where: { status } });
		if (!statusData) {
			throw new HttpException({ status: ResponseData.INVALID_STATUS }, HttpStatus.OK);
		}
		return statusData;
	}

	async saveRefdocInterimDataAndStatus(
		queryRunner: QueryRunner,
		refdocId: number,
		interimData: string,
		approveRefDocDto: ApproveRefDocDto,
		userId: number
	) {
		const { status, firstName, middleName, lastName, suffixName } = approveRefDocDto;
		await queryRunner.manager.getRepository(UserMasterEntity).update(
			{ userId },
			{
				firstName,
				middleName,
				lastName,
				suffixName
			}
		);
		return await queryRunner.manager.getRepository(RefdocMaster).update({ refdocId }, { interimData, status });
	}

	async getRefdocDataByAddressAndZip(addressTwo: string, zip: string) {
		let refdocData = await this.dataSource.getRepository(RefdocMaster).find({
			where: {
				addressTwo,
				zip
			}
		});
		return refdocData;
	}

	async getDropdownOptions(dropdownName: string, page: string) {
		let dropdownOptions = await this.dataSource.getRepository(DropdownOption).find({
			where: {
				dropdownName,
				page,
				status: Status.ACTIVE
			}
		});
		if (!dropdownOptions || dropdownOptions.length === 0) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return dropdownOptions;
	}

	async getRefdocIdsForRequestedMonthlyProofs() {
		const refdocData = await this.dataSource
			.getRepository(RefdocMaster)
			.createQueryBuilder("refdocMaster")
			.innerJoin(ValidationDocMasterProof, "masterProof", "masterProof.refdocId = refdocMaster.refdocId")
			.innerJoin(ValidationDocMonthlyProof, "monthlyProof", "monthlyProof.masterProofId = masterProof.id")
			.select("DISTINCT refdocMaster.refdocId", "refdocId")
			.where("masterProof.masterProofType != :masterProofType", { masterProofType: MasterProofTypeEnum.PLAID })
			.andWhere("monthlyProof.monthlyProofType = :monthlyProofType AND monthlyProof.status = :status", {
				monthlyProofType: MonthlyProofTypeEnum.RECEIPT,
				status: MonthlyProofStatusEnum.REQUESTED
			})
			.getRawMany();
		return refdocData;
	}

	async getRefdocParticipantsByMonthlyProofId(monthlyProofId: number) {
		const refdocData = await this.dataSource
			.getRepository(ValidationDocMonthlyProof)
			.createQueryBuilder("monthlyProof")
			.innerJoin(ValidationDocMasterProof, "masterProof", "masterProof.id = monthlyProof.masterProofId")
			.innerJoin(RefdocMaster, "refdocMaster", "refdocMaster.refdocId = masterProof.refdocId")
			.innerJoin(ParticipantMapRequest, "mapRequest", "mapRequest.refdocId = refdocMaster.refdocId")
			.select("COUNT(mapRequest.id) AS refdocParticipantCount")
			.where("monthlyProof.id  =:monthlyProofId", { monthlyProofId })
			.groupBy("mapRequest.refdocId")
			.getRawOne();

		return refdocData;
	}

	async getRefdocParticipantsByRefdocId(refdocId: number) {
		const refdocData = await this.dataSource
			.getRepository(ParticipantMapRequest)
			.createQueryBuilder("mapRequest")
			.select("COUNT(mapRequest.id) AS refdocParticipantCount")
			.where("mapRequest.refdocId  =:refdocId", { refdocId })
			.groupBy("mapRequest.refdocId")
			.getRawOne();

		return refdocData;
	}

	async getRefdocDataByMasterProofId(masterProofId: number) {
		const refdocData = await this.dataSource
			.getRepository(ValidationDocMasterProof)
			.createQueryBuilder("masterProof")
			.innerJoin(RefdocMaster, "refdoc", "refdoc.refdocId = masterProof.refdocId")
			.select("refdoc.refdocId as refdocId")
			.where("masterProof.id =:masterProofId", { masterProofId })
			.getRawOne();
		if (!refdocData) {
			throw new HttpException({ status: ResponseData.INVALID_MASTER_PROOF_ID }, HttpStatus.OK);
		}
		return refdocData;
	}

	async getPlaidMasterProofs() {
		const refdocData = await this.dataSource
			.getRepository(ValidationDocMasterProof)
			.createQueryBuilder("masterProof")
			.innerJoin(PlaidLinkTokens, "plaidLinkTokens", "plaidLinkTokens.id = masterProof.plaidTokenId")
			.select(GetPlaidMasterProofs)
			.where("masterProof.masterProofType = :masterProofType", { masterProofType: MasterProofTypeEnum.PLAID })
			.getRawMany();
		return refdocData;
	}
}
