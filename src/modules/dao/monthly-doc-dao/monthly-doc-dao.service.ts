import { DisputeEntity, DisputeStatusEnum } from "@modules/dispute/entities/dispute.entity";
import { DropdownOption } from "@modules/doc/entities/dropdown-options.entity";
import { PaymentSchedule, PaymentScheduleStatus } from "@modules/doc/entities/payment-schedule.entity";
import { PaymentValidationdocMapping } from "@modules/doc/entities/payment-validationdoc-mapping.entity";
import { RefdocMaster } from "@modules/doc/entities/refdoc-master.entity";
import { RefdocRejectionReasonMaster } from "@modules/doc/entities/refdoc-rejection-reason-master.entity";
import { RefdocTypeMaster } from "@modules/doc/entities/refdoc-type-master.entity";
import { StatusMasterEntity } from "@modules/doc/entities/status-master.entity";
import {
	MasterProofTypeEnum,
	ProofStatus,
	ValidationDocMasterProof
} from "@modules/doc/entities/validation-doc-master-proof.entity";
import { GetCreditorPayPlaidDataDto } from "@modules/monthly-proof/dto/get-creditor-pay-plaid.dto";
import { GetMontlyProofDto } from "@modules/monthly-proof/dto/get-monthly-proofs.dto";
import { CreditorUpdatesAsync, StatusEnum } from "@modules/monthly-proof/entities/creditor-updates-async.entity";
import { LeaseSpecificNonCreditorList } from "@modules/monthly-proof/entities/lease-specific-non-creditor-list.entity";
import { MonthlyVerifiedProofsEntity } from "@modules/monthly-proof/entities/monthly-proof-verified.entity";
import { NonCreditorList } from "@modules/monthly-proof/entities/non-creditor-list.entity";
import { ValidationDocMonthlyProof } from "@modules/monthly-proof/entities/validation-doc-monthly-proof.entity";
import { PlaidLinkTokens } from "@modules/plaid/entities/plaid-link-tokens.entity";
import { UserMasterEntity } from "@modules/user-master/entities/user-master.entity";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import {
	DocMonthlyProofByTypeAndStatus,
	GetMasterProofIdReportingMonthYearByStatus,
	GetMonthlyProofTotalAmount,
	GetVerifiedProofs,
	MonthlyProofFullDetails,
	PlaidMonthlyProofDataByStatus,
	RefdocPaymentWiseTotalRentPaid,
	UserMonthlyProofsForRefdoc,
	getMasterProofDataByRefdocIdMonthYearWithDisputeData,
	getMasterProofDataByRefdocIdMonthYearWithMonthlyData,
	getMonthlyProofNameByMasterProofId,
	getMonthlyProofsOfPayeeByRefdocId,
	getPlaidMonthlyProofDataForLookBack,
	GetmonthlyProofDetailsById,
	monthlyProofDataAndRefdocId,
	GetPlaidTxnsData,
	GetPaymentSchedule,
	GetCreditorPayPlaidData
} from "@utils/constants/querry-constants";
import { MonthlyProofStatusEnum, ReceiptStatusEnum, VerifiedProofStatusEnum } from "@utils/enums/Status";
import { ResponseData } from "@utils/enums/response";
import { MonthlyProofTypeEnum } from "@utils/enums/txn-types";
import { DataSource, In, Like, MoreThan, QueryRunner, SelectQueryBuilder } from "typeorm";

@Injectable()
export class MonthlyDocDaoService {
	constructor(private readonly dataSource: DataSource) {}

	async insertMonthlyProofDetailsByQueryRunner(montlyProofDetails: ValidationDocMonthlyProof[], queryRunner: QueryRunner) {
		await queryRunner.manager.getRepository(ValidationDocMonthlyProof).insert(montlyProofDetails);
	}

	async saveMonthlyProofDoc(validationDocMonthlyProof: ValidationDocMonthlyProof) {
		return await this.dataSource.getRepository(ValidationDocMonthlyProof).save(validationDocMonthlyProof);
	}

	async saveMonthlyProofDocFromQueryRunner(
		queryRunner: QueryRunner,
		validationDocMonthlyProof: ValidationDocMonthlyProof
	) {
		return await queryRunner.manager.getRepository(ValidationDocMonthlyProof).save(validationDocMonthlyProof);
	}

	async saveVerifiedMonthlyProofFromQueryRunner(
		queryRunner: QueryRunner,
		verifiedMonthlyProofs: MonthlyVerifiedProofsEntity[]
	) {
		return await queryRunner.manager.getRepository(MonthlyVerifiedProofsEntity).save(verifiedMonthlyProofs);
	}

	async getMonthlyVerifiedProofsByTransactionIdAndPaymentType(transactionId: string, paymentType: string) {
		return await this.dataSource
			.getRepository(MonthlyVerifiedProofsEntity)
			.createQueryBuilder("verifiedMonthlyProofs")
			.innerJoin(ValidationDocMasterProof, "masterProof", "masterProof.id = verifiedMonthlyProofs.masterProofId")
			.select(["verifiedMonthlyProofs.*"])
			.where("verifiedMonthlyProofs.fiRefNo = :transactionId", { transactionId })
			.andWhere("masterProof.paymentType = :paymentType", { paymentType })
			.andWhere("verifiedMonthlyProofs.status = :status", { status: VerifiedProofStatusEnum.APPROVED })
			.getRawOne();
	}

	async getMonthlyVerifiedProofsById(verifiedProofId: number) {
		const verifiedProofData = await this.dataSource.getRepository(MonthlyVerifiedProofsEntity).findOne({
			where: {
				id: verifiedProofId,
				status: VerifiedProofStatusEnum.APPROVED,
				monthlyProofType: MonthlyProofTypeEnum.TRANSACTION
			}
		});
		if (!verifiedProofData) {
			throw new HttpException({ status: ResponseData.INVALID_VERIFIED_PROOF_ID }, HttpStatus.OK);
		}
		return verifiedProofData;
	}

	async getMonthlyVerifiedProofsByTxnIds(txnIds: string[]) {
		const verifiedProofData = await this.dataSource.getRepository(MonthlyVerifiedProofsEntity).find({
			where: {
				fiRefNo: In(txnIds),
				status: VerifiedProofStatusEnum.APPROVED,
				monthlyProofType: MonthlyProofTypeEnum.TRANSACTION
			}
		});

		if (!verifiedProofData || verifiedProofData.length === 0) {
			throw new HttpException({ status: ResponseData.INVALID_VERIFIED_PROOF_ID }, HttpStatus.OK);
		}

		return verifiedProofData;
	}

	async getMonthlyVerifiedProofsByMasterProofId(masterProofId: number) {
		const verifiedProofData = await this.dataSource.getRepository(MonthlyVerifiedProofsEntity).find({
			where: {
				masterProofId,
				status: VerifiedProofStatusEnum.APPROVED,
				monthlyProofType: MonthlyProofTypeEnum.TRANSACTION
			}
		});
		if (verifiedProofData.length === 0) {
			throw new HttpException({ status: ResponseData.INVALID_VERIFIED_PROOF_ID }, HttpStatus.OK);
		}
		return verifiedProofData;
	}

	async getScheduleIdFromPaymentSchedule(refdocId: number, month: string, year: number) {
		const result = await this.dataSource
			.getRepository(PaymentSchedule)
			.createQueryBuilder("schedule")
			.select(["schedule.id as scheduleId"])
			.where("schedule.leaseId = :refdocId", { refdocId })
			.andWhere("schedule.year = :year", { year })
			.andWhere("schedule.month = :month", { month })
			.getRawOne();

		if (!result) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return result;
	}

	async getmonthlyProofDocById(monthlyProofId: number) {
		const monthltProofData = await this.dataSource.getRepository(ValidationDocMonthlyProof).findOne({
			where: {
				id: monthlyProofId
			}
		});
		if (!monthltProofData) {
			throw new HttpException({ status: ResponseData.INVALID_MONTHLY_PROOF_ID }, HttpStatus.OK);
		}
		return monthltProofData;
	}

	async getmonthlyProofDocByDisputeId(disputeId: number) {
		const monthltProofData = await this.dataSource.getRepository(ValidationDocMonthlyProof).find({
			where: {
				disputeId
			},
			order: {
				createdAt: "ASC"
			}
		});

		return monthltProofData;
	}

	async getmonthlyProofDocByDisputeIdAndStatus(disputeId: number, status: MonthlyProofStatusEnum[]) {
		const monthltProofData = await this.dataSource.getRepository(ValidationDocMonthlyProof).find({
			where: {
				disputeId,
				status: In(status)
			}
		});

		return monthltProofData;
	}

	async getmonthlyProofDetailsById(monthlyProofId: number) {
		const monthltProofData = await this.dataSource
			.getRepository(ValidationDocMonthlyProof)
			.createQueryBuilder("monthlyProof")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = monthlyProof.status")
			.leftJoin(RefdocRejectionReasonMaster, "rejectionReasons", "rejectionReasons.id = monthlyProof.rejectedReason")
			.select(GetmonthlyProofDetailsById)
			.where(`monthlyProof.id = :monthlyProofId`, { monthlyProofId })
			.getRawOne();
		if (!monthltProofData) {
			throw new HttpException({ status: ResponseData.INVALID_MONTHLY_PROOF_ID }, HttpStatus.OK);
		}
		return monthltProofData;
	}

	async getCreditorPayPlaidData(creditorPayPlaidDto: GetCreditorPayPlaidDataDto, userIds: number[], refdocIds: number[]) {
		let { leaseId, customerId, state, page, limit } = creditorPayPlaidDto;
		if (!page) {
			page = 1;
		}
		if (!limit) {
			limit = 20;
		}
		let offset = (page - 1) * limit;
		let queryBuilder = this.dataSource
			.getRepository(RefdocMaster)
			.createQueryBuilder("refdoc")
			.innerJoin(UserMasterEntity, "users", "users.userId = refdoc.userId")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = refdoc.status")
			.select(GetCreditorPayPlaidData)
			.where(`(:leaseId IS NULL OR refdoc.displayRefdocId = :leaseId)`, { leaseId })
			.andWhere(`(:customerId IS NULL OR users.userId = :customerId)`, { customerId })
			.andWhere(`(:state IS NULL OR refdoc.state = :state)`, { state });
		if (userIds.length) {
			queryBuilder.andWhere(`users.userId IN (:...userIds)`, {
				userIds
			});
		}
		if (refdocIds.length) {
			queryBuilder.andWhere(`refdoc.refdocId IN (:...refdocIds)`, {
				refdocIds
			});
		}
		const total = await queryBuilder.getCount();
		if (offset > total) {
			offset = 0;
		}
		const creditorPayPlaidData = await queryBuilder.offset(offset).limit(limit).getRawMany();
		if (!creditorPayPlaidData?.length) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return { creditorPayPlaidData, total };
	}

	async getDocMonthlyProofByMonthlyProofTypeAndStatus(getMontlyProofDto: GetMontlyProofDto, monthlyProofIds) {
		let {
			page,
			limit,
			status,
			paymentType,
			emailId,
			mobileNo,
			ssnId,
			name,
			userName,
			refdocId,
			masterProofId,
			masterProofType,
			paymentMonth,
			paymentYear,
			state,
			customerId,
			disputeId
		} = getMontlyProofDto;

		if (!page) {
			page = 1;
		}
		if (!limit) {
			limit = 20;
		}
		let offset = (page - 1) * limit;

		let refdocStatus = status?.split(",");
		let newRefdocStatus = refdocStatus;

		refdocStatus = this.handleRefdocStatus(refdocStatus);

		let queryBuilder = this.dataSource
			.getRepository(ValidationDocMonthlyProof)
			.createQueryBuilder("monthlyProof")
			.innerJoin(ValidationDocMasterProof, "masterProof", "masterProof.id = monthlyProof.masterProofId")
			.innerJoin(RefdocMaster, "refdocMaster", "refdocMaster.refdocId = masterProof.refdocId")
			.innerJoin(UserMasterEntity, "users", "users.userId = monthlyProof.userId")
			.innerJoin(UserMasterEntity, "payeeUser", "payeeUser.userId = masterProof.payeeId")
			.innerJoin(UserMasterEntity, "primaryUser", "primaryUser.userId = refdocMaster.userId")
			.innerJoin(RefdocTypeMaster, "refdocType", "refdocMaster.refdocTypeId = refdocType.refdocTypeId")
			.innerJoin(
				PaymentValidationdocMapping,
				"paymentdocMapping",
				"paymentdocMapping.paymentType = masterProof.paymentType"
			)
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = monthlyProof.status")
			.select(DocMonthlyProofByTypeAndStatus)
			.where(`(monthlyProof.status IN (:...status))`, { status: refdocStatus })
			.andWhere(`(:paymentType IS NULL OR masterProof.paymentType = :paymentType)`, { paymentType })
			.andWhere(
				`(:emailId IS NULL OR users.emailId = :emailId OR payeeUser.emailId = :emailId  OR primaryUser.emailId = :emailId)`,
				{ emailId }
			)
			.andWhere(
				`(:customerId IS NULL OR users.userId = :customerId OR payeeUser.userId = :customerId  OR primaryUser.userId = :customerId)`,
				{ customerId }
			)
			.andWhere(
				`(:mobileNo IS NULL OR users.mobileNo = :mobileNo OR payeeUser.mobileNo = :mobileNo  OR primaryUser.mobileNo = :mobileNo)`,
				{ mobileNo }
			)
			.andWhere(
				`(:ssnId IS NULL OR users.primaryIdValue = :ssnId OR payeeUser.primaryIdValue = :ssnId OR primaryUser.primaryIdValue = :ssnId)`,
				{ ssnId }
			)
			.andWhere(
				`(:name IS NULL OR CONCAT(users.firstName, ' ', users.lastName) LIKE :name OR CONCAT(payeeUser.firstName, ' ', payeeUser.lastName) LIKE :name OR CONCAT(primaryUser.firstName, ' ', primaryUser.lastName) LIKE :name)`,
				{
					name: `%${name || ""}%`
				}
			)
			.andWhere(
				`(:username IS NULL OR users.username LIKE :username OR payeeUser.username LIKE :username OR primaryUser.username LIKE :username )`,
				{
					username: `%${userName || ""}%`
				}
			)
			.andWhere(`(:refdocId IS NULL OR refdocMaster.displayRefdocId = :refdocId)`, { refdocId })
			.andWhere(`(:masterProofId IS NULL OR masterProof.id = :masterProofId)`, { masterProofId })
			.andWhere(`(:disputeId IS NULL OR monthlyProof.disputeId = :disputeId)`, { disputeId })
			.andWhere(`(:state IS NULL OR refdocMaster.state = :state)`, { state })
			.andWhere(`(:paymentMonth IS NULL OR monthlyProof.reportingMonth = :paymentMonth)`, { paymentMonth })
			.andWhere(`(:paymentYear IS NULL OR monthlyProof.reportingYear = :paymentYear)`, { paymentYear });

		queryBuilder = this.createConditionalQueryBuilder(queryBuilder, masterProofType, monthlyProofIds, newRefdocStatus);
		const total = await queryBuilder.getCount();
		if (offset > total) {
			offset = 0;
		}
		const monthlyDocData = await queryBuilder
			.orderBy("monthlyProof.updatedAt", "ASC")
			.offset(offset)
			.limit(limit)
			.getRawMany();
		if (!monthlyDocData?.length) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return { monthlyDocData, total };
	}

	handleRefdocStatus(refdocStatus) {
		if (
			(refdocStatus.includes(MonthlyProofStatusEnum.REUPLOADED) ||
				refdocStatus.includes(MonthlyProofStatusEnum.PARTIALLY_APPROVED)) &&
			refdocStatus.includes(MonthlyProofStatusEnum.NEWLY_UPLOADED)
		) {
			const statusToRemove = [];
			statusToRemove.push(MonthlyProofStatusEnum.REUPLOADED);
			statusToRemove.push(MonthlyProofStatusEnum.NEWLY_UPLOADED);
			refdocStatus = refdocStatus.filter((item) => !statusToRemove.includes(item));
			refdocStatus.push(MonthlyProofStatusEnum.REQUESTED);
		}

		if (
			refdocStatus.includes(MonthlyProofStatusEnum.REUPLOADED) ||
			refdocStatus.includes(MonthlyProofStatusEnum.NEWLY_UPLOADED)
		) {
			refdocStatus = [];
			refdocStatus.push(MonthlyProofStatusEnum.REQUESTED);
		}
		return refdocStatus;
	}

	createConditionalQueryBuilder(
		queryBuilder: SelectQueryBuilder<ValidationDocMonthlyProof>,
		masterProofType,
		monthlyProofIds,
		newRefdocStatus
	) {
		if (masterProofType) {
			queryBuilder.andWhere(`masterProof.masterProofType = :masterProofType`, {
				masterProofType
			});
		} else {
			queryBuilder.andWhere(`masterProof.masterProofType <> :masterProofType`, {
				masterProofType: MasterProofTypeEnum.PLAID
			});
		}

		if (
			monthlyProofIds?.length &&
			newRefdocStatus.includes(MonthlyProofStatusEnum.REUPLOADED) &&
			!newRefdocStatus.includes(MonthlyProofStatusEnum.NEWLY_UPLOADED)
		) {
			queryBuilder.andWhere(`monthlyProof.id IN (:...monthlyProofIds)`, {
				monthlyProofIds
			});
			queryBuilder.addSelect("'Reuploaded' AS statusDesc");
		}
		if (
			monthlyProofIds?.length &&
			newRefdocStatus.includes(MonthlyProofStatusEnum.NEWLY_UPLOADED) &&
			!newRefdocStatus.includes(MonthlyProofStatusEnum.REUPLOADED) &&
			!newRefdocStatus.includes(MonthlyProofStatusEnum.PARTIALLY_APPROVED)
		) {
			queryBuilder.andWhere(`monthlyProof.id NOT IN (:...monthlyProofIds)`, {
				monthlyProofIds
			});
			queryBuilder.addSelect("'Newly Uploaded' AS statusDesc");
		}
		if (
			monthlyProofIds?.length &&
			newRefdocStatus.includes(MonthlyProofStatusEnum.NEWLY_UPLOADED) &&
			(newRefdocStatus.includes(MonthlyProofStatusEnum.REUPLOADED) ||
				newRefdocStatus.includes(MonthlyProofStatusEnum.PARTIALLY_APPROVED))
		) {
			queryBuilder
				.addSelect(
					`CASE 
					 WHEN monthlyProof.id IN (:...monthlyProofIds) AND monthlyProof.status = 'REQUESTED' THEN 'Reuploaded' 
					 WHEN monthlyProof.id NOT IN (:...monthlyProofIds) AND monthlyProof.status = 'REQUESTED' THEN 'Newly Uploaded'
					 ELSE statusMaster.description
					 END`,
					"statusDesc"
				)
				.setParameter("monthlyProofIds", monthlyProofIds);
		}
		return queryBuilder;
	}

	async updateDocMonthlyStatus(
		id: number,
		status: MonthlyProofStatusEnum,
		verifiedBy: number,
		previousStatus: MonthlyProofStatusEnum
	) {
		return await this.dataSource
			.getRepository(ValidationDocMonthlyProof)
			.update({ id, status: previousStatus }, { status, updatedAt: new Date(), verifiedBy, verifiedAt: new Date() });
	}

	async getMonthlyProofByIdMonthlyProofTypeAndStatus(
		id: number,
		status: MonthlyProofStatusEnum,
		monthlyProofType: MonthlyProofTypeEnum
	) {
		const monthlyProof = await this.dataSource.getRepository(ValidationDocMonthlyProof).findOne({
			where: {
				id,
				status,
				monthlyProofType
			}
		});
		if (!monthlyProof) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return monthlyProof;
	}

	async getMonthlyProofByStatus(status: MonthlyProofStatusEnum) {
		const monthlyProof = await this.dataSource.getRepository(ValidationDocMonthlyProof).find({
			where: {
				status
			}
		});
		return monthlyProof;
	}

	async getMasterProofIdReportingMonthYearByStatus(status: MonthlyProofStatusEnum) {
		return await this.dataSource
			.getRepository(ValidationDocMonthlyProof)
			.createQueryBuilder("monthlyProof")
			.select(GetMasterProofIdReportingMonthYearByStatus)
			.where("monthlyProof.status = :status", { status })
			.getRawMany();
	}

	async getMonthlyProofFullDetails(monthlyProofId: number, monthlyProofIds) {
		const whereCondition = {
			id: monthlyProofId
		};
		const queryBuilder = this.dataSource
			.getRepository(ValidationDocMonthlyProof)
			.createQueryBuilder("monthlyProof")
			.innerJoin(ValidationDocMasterProof, "masterProof", "masterProof.id = monthlyProof.masterProofId")
			.innerJoin(RefdocMaster, "refdocMaster", "refdocMaster.refdocId = masterProof.refdocId")
			.innerJoin(RefdocTypeMaster, "refdocType", "refdocMaster.refdocTypeId = refdocType.refdocTypeId")
			.innerJoin(
				PaymentValidationdocMapping,
				"paymentdocMapping",
				"paymentdocMapping.paymentType = masterProof.paymentType"
			)
			.innerJoin(
				PaymentSchedule,
				"schedule",
				"schedule.leaseId = masterProof.refdocId AND schedule.month = monthlyProof.reportingMonth AND schedule.year = monthlyProof.reportingYear"
			)
			.innerJoin(StatusMasterEntity, "scheduleStatusMaster", "scheduleStatusMaster.status = schedule.status")
			.innerJoin(StatusMasterEntity, "monthlyStatusMaster", "monthlyStatusMaster.status = monthlyProof.status")
			.innerJoin(StatusMasterEntity, "refdocStatusMaster", "refdocStatusMaster.status = refdocMaster.status")
			.innerJoin(UserMasterEntity, "masterUser", "masterUser.userId = masterProof.payeeId")
			.innerJoin(UserMasterEntity, "primaryUser", "primaryUser.userId = masterProof.userId")
			.leftJoin(UserMasterEntity, "verifyUser", "verifyUser.userId = monthlyProof.verifiedBy")
			.leftJoin(RefdocRejectionReasonMaster, "rejectionReasons", "rejectionReasons.id = monthlyProof.rejectedReason")
			.select(MonthlyProofFullDetails)
			.andWhere(whereCondition);
		if (monthlyProofIds?.length) {
			queryBuilder
				.addSelect(
					`CASE 
					 WHEN monthlyProof.id IN (:...monthlyProofIds) AND monthlyProof.status = 'REQUESTED' THEN 'Reuploaded' 
					 WHEN monthlyProof.id NOT IN (:...monthlyProofIds) AND monthlyProof.status = 'REQUESTED' THEN 'Newly Uploaded'
					 ELSE monthlyStatusMaster.description
					 END`,
					"monthlyProofStatusDesc"
				)
				.setParameter("monthlyProofIds", monthlyProofIds);
		}

		const monthlyProofDetails = await queryBuilder.getRawOne();
		if (!monthlyProofDetails) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		monthlyProofDetails.masterProofDetail = JSON.parse(monthlyProofDetails.masterProofDetail);
		monthlyProofDetails.monthlyProofPath = JSON.parse(monthlyProofDetails.monthlyProofPath);
		monthlyProofDetails.monthlyProofDetail = JSON.parse(monthlyProofDetails.monthlyProofDetail);
		if (monthlyProofDetails.monthlyProofReceipt) {
			const receiptObjArr = JSON.parse(monthlyProofDetails.monthlyProofReceipt);
			receiptObjArr.forEach((receiptObj) => {
				if (receiptObj["status"] === ReceiptStatusEnum.REQUESTED) {
					monthlyProofDetails.monthlyProofReceipt = JSON.stringify([receiptObj["receiptUrl"]]);
				}
			});
		}

		monthlyProofDetails.startDate = new Date(
			new Date(monthlyProofDetails.dueDate).setDate(new Date(monthlyProofDetails.dueDate).getDate() - 15)
		);
		monthlyProofDetails.endDate = monthlyProofDetails.paymentDueDate;
		return monthlyProofDetails;
	}

	async getPlaidTxnsData(refdocId: number, month: string, year: number) {
		const queryBuilder = this.dataSource
			.createQueryBuilder(RefdocMaster, "refdoc")
			.innerJoin(StatusMasterEntity, "refdocStatusMaster", "refdocStatusMaster.status = refdoc.status")
			.select(GetPlaidTxnsData)
			.where("refdoc.refdocId = :refdocId", { refdocId });
		if (year && month) {
			queryBuilder
				.innerJoin(PaymentSchedule, "paymentSchedule", "paymentSchedule.leaseId = refdoc.refdocId ")
				.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = paymentSchedule.status")
				.addSelect(GetPaymentSchedule)
				.andWhere("paymentSchedule.month = :month", { month })
				.andWhere("paymentSchedule.year = :year", { year });
		}

		const plaidTxnData = await queryBuilder.getRawOne();
		if (!plaidTxnData) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return plaidTxnData;
	}

	async getRefdocPaymentWiseTotalRentPaid(refdocId: number, reportingMonth: string, reportingYear: number) {
		return await this.dataSource
			.createQueryBuilder(MonthlyVerifiedProofsEntity, "verifiedProofs")
			.innerJoin(ValidationDocMasterProof, "masterProof", "masterProof.id = verifiedProofs.masterProofId")
			.innerJoin(
				PaymentValidationdocMapping,
				"paymentValidationDocMapping",
				"paymentValidationDocMapping.paymentType = masterProof.paymentType"
			)
			.leftJoin(UserMasterEntity, "verifyUser", "verifyUser.userId = verifiedProofs.verifiedBy")
			.select(RefdocPaymentWiseTotalRentPaid)
			.where("masterProof.refdocId = :refdocId", { refdocId })
			.andWhere("verifiedProofs.reportingMonth = :reportingMonth", { reportingMonth })
			.andWhere("verifiedProofs.reportingYear = :reportingYear", { reportingYear })
			.andWhere("verifiedProofs.status = :status", { status: VerifiedProofStatusEnum.APPROVED })
			.getRawMany();
	}

	async getUserMonthlyProofsForRefdoc(
		userId: number,
		refdocId: number,
		status: MonthlyProofStatusEnum,
		monthName: string,
		year: number
	) {
		const monthlyProofs = await this.dataSource
			.createQueryBuilder(ValidationDocMasterProof, "masterProof")
			.innerJoin(ValidationDocMonthlyProof, "monthlyProof", "masterProof.id = monthlyProof.masterProofId")
			.select(UserMonthlyProofsForRefdoc)
			.where("masterProof.refdocId = :refdocId", { refdocId })
			.andWhere("masterProof.payeeId = :payeeId", { payeeId: userId })
			.andWhere("monthlyProof.status = :status", { status })
			.andWhere("monthlyProof.reportingMonth = :monthName", { monthName })
			.andWhere("monthlyProof.reportingYear = :year", { year })
			.getRawMany();
		if (!monthlyProofs.length) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		monthlyProofs.forEach((monthlyProof) => {
			monthlyProof.masterProofDetail = JSON.parse(monthlyProof.masterProofDetail);
			monthlyProof.monthlyProofDetail = JSON.parse(monthlyProof.monthlyProofDetail);
		});
		return monthlyProofs;
	}

	async getPlaidMonthlyProofDataByStatusAndMonthlyProofType(
		dataFetchPendingStatus: MonthlyProofStatusEnum[],
		monthlyProofType: MonthlyProofTypeEnum
	) {
		const plaidData = await this.dataSource
			.getRepository(ValidationDocMonthlyProof)
			.createQueryBuilder("monthlyProof")
			.innerJoin(ValidationDocMasterProof, "masterProof", "masterProof.id = monthlyProof.masterProofId")
			.innerJoin(PlaidLinkTokens, "plaidLinkTokens", "plaidLinkTokens.id = masterProof.plaidTokenId")
			.select(PlaidMonthlyProofDataByStatus)
			.where(
				"monthlyProof.status IN (:...dataFetchPendingStatus) AND monthlyProof.monthlyProofType = :monthlyProofType AND monthlyProof.fetchTill >= :currentDate",
				{ dataFetchPendingStatus, monthlyProofType, currentDate: new Date() }
			)
			.getRawMany();
		return plaidData;
	}

	async updateMonthlyDocProofDetailsAndStatus(id: number, proofDetail: string, status: MonthlyProofStatusEnum) {
		return await this.dataSource
			.getRepository(ValidationDocMonthlyProof)
			.update({ id }, { status, updatedAt: new Date(), proofDetail });
	}

	async updateMonthlyDocProofDetails(validationDocMonthlyProof: ValidationDocMonthlyProof[]) {
		return await this.dataSource.getRepository(ValidationDocMonthlyProof).save(validationDocMonthlyProof);
	}

	async updateMonthlyDocProofDetailsByQueryRunner(
		validationDocMonthlyProof: ValidationDocMonthlyProof[],
		queryRunner: QueryRunner
	) {
		return await queryRunner.manager.getRepository(ValidationDocMonthlyProof).save(validationDocMonthlyProof);
	}

	async getMonthlyProofByMasterProofIds(masterProofIds: number[]) {
		return await this.dataSource.getRepository(ValidationDocMonthlyProof).find({
			select: { id: true, status: true },
			where: {
				masterProofId: In(masterProofIds)
			}
		});
	}

	async getMonthlyProofByMasterProofIdsReportingYearsMonths(
		masterProofIds: number[],
		reportingMonths: string[],
		reportingYears: number[]
	) {
		return await this.dataSource.getRepository(ValidationDocMonthlyProof).find({
			where: {
				masterProofId: In(masterProofIds),
				reportingMonth: In(reportingMonths),
				reportingYear: In(reportingYears),
				status: MonthlyProofStatusEnum.REQUESTED
			}
		});
	}

	async getMonthlyProofByMasterProofIdReportingYearAndMonth(
		masterProofId: number,
		reportingMonth: string,
		reportingYear: number
	) {
		return await this.dataSource.getRepository(ValidationDocMonthlyProof).findOne({
			where: {
				masterProofId: masterProofId,
				reportingMonth: reportingMonth,
				reportingYear: reportingYear,
				status: In([MonthlyProofStatusEnum.DATA_FETCH_PENDING, MonthlyProofStatusEnum.PARTIALLY_APPROVED])
			}
		});
	}

	async getMonthlyProofTotalAmount(monthlyProofId: number) {
		const data = await this.dataSource
			.getRepository(ValidationDocMonthlyProof)
			.createQueryBuilder("monthlyProof")
			.innerJoin(ValidationDocMasterProof, "masterProof", "masterProof.id = monthlyProof.masterProofId")
			.select(monthlyProofDataAndRefdocId)
			.where("monthlyProof.id = :monthlyProofId", { monthlyProofId })
			.getRawOne();
		const refdocId = data.refdocId;
		const reportingYear = data.reportingYear;
		const reportingMonth = data.reportingMonth;
		const totalAmount = await this.dataSource
			.createQueryBuilder(ValidationDocMasterProof, "masterProof")
			.innerJoin(ValidationDocMonthlyProof, "monthlyProof", "masterProof.id = monthlyProof.masterProofId")
			.select(GetMonthlyProofTotalAmount)
			.where("masterProof.refdoc_id = :refdocId", { refdocId })
			.andWhere("monthlyProof.status = :status", { status: MonthlyProofStatusEnum.APPROVED })
			.andWhere("monthlyProof.reportingYear = :reportingYear", { reportingYear })
			.andWhere("monthlyProof.reportingMonth = :reportingMonth", { reportingMonth })
			.groupBy("masterProof.refdocId")
			.getRawOne();
		const totalPaidAmount = totalAmount.amount;
		return { totalPaidAmount, refdocId, reportingYear, reportingMonth };
	}

	async getMonthlyProofTotalAmountByQueryRunner(queryRunner: QueryRunner, monthlyProofId: number) {
		return await queryRunner.manager
			.getRepository(ValidationDocMonthlyProof)
			.createQueryBuilder("monthlyProof")
			.innerJoin(ValidationDocMasterProof, "masterProof", "masterProof.id = monthlyProof.masterProofId")
			.select(monthlyProofDataAndRefdocId)
			.where("monthlyProof.id = :monthlyProofId", { monthlyProofId })
			.getRawOne();
	}

	async getPaymentScheduleAmount(refdocId: number, firstDate: Date, lastDate: Date) {
		const paymentScheduleData = await this.dataSource
			.getRepository(PaymentSchedule)
			.createQueryBuilder("schedule")
			.select(["schedule.amount as amount", "schedule.id as id"])
			.where("schedule.leaseId = :refdocId", { refdocId })
			.andWhere("schedule.dueDate >= :firstDate", { firstDate })
			.andWhere("schedule.dueDate <= :lastDate", { lastDate })
			.getRawOne();
		if (!paymentScheduleData) {
			throw new HttpException({ status: ResponseData.PAYMENT_SCHEDULE_NOT_FOUND }, HttpStatus.OK);
		}
		const { amount, id } = paymentScheduleData;
		return { amount, id };
	}

	async getPaymentScheduleAmountByMonthAndYear(refdocId: number, month: string, year: number) {
		const paymentScheduleData = await this.dataSource.getRepository(PaymentSchedule).findOne({
			where: {
				leaseId: refdocId,
				month,
				year
			}
		});
		if (!paymentScheduleData) {
			throw new HttpException({ status: ResponseData.PAYMENT_SCHEDULE_NOT_FOUND }, HttpStatus.OK);
		}
		return paymentScheduleData;
	}

	async getNextPaymentScheduleAfterDueDate(refdocId: number, dueDate: Date) {
		return await this.dataSource.getRepository(PaymentSchedule).findOne({
			where: {
				leaseId: refdocId,
				dueDate: MoreThan(dueDate)
			},
			order: {
				dueDate: "ASC"
			}
		});
	}

	async updatePaymentScheduleStatus(id: number, status: PaymentScheduleStatus) {
		await this.dataSource.getRepository(PaymentSchedule).update({ id }, { status, updatedAt: new Date() });
	}

	async updatePaymentScheduleStatusByQueryRunner(queryRunner: QueryRunner, id: number, status: PaymentScheduleStatus) {
		await queryRunner.manager.getRepository(PaymentSchedule).update({ id }, { status, updatedAt: new Date() });
	}

	async getmonthlyProofDocByMasterProofMonthAndYear(
		masterProofId: number,
		reportingMonth: string,
		reportingYear: number,
		status?: MonthlyProofStatusEnum[],
		fiRefNo?: string
	) {
		const whereConditions: any = {
			masterProofId,
			reportingMonth,
			reportingYear
		};

		if (status?.length) {
			whereConditions.status = In(status);
		}
		if (fiRefNo) {
			whereConditions.fiRefNo = Like(`%${fiRefNo}%`);
		}

		return await this.dataSource.getRepository(ValidationDocMonthlyProof).findOne({
			where: whereConditions
		});
	}

	async getMasterProofDataByRefdocIdMonthYearWithMonthlyData(
		refdocId: number,
		reportingMonth: string,
		reportingYear: number,
		payeeId: number
	) {
		return await this.dataSource
			.getRepository(ValidationDocMasterProof)
			.createQueryBuilder("masterProof")
			.innerJoin(
				PaymentValidationdocMapping,
				"paymentValidationDocMapping",
				"paymentValidationDocMapping.paymentType = masterProof.paymentType"
			)
			.leftJoin(
				ValidationDocMonthlyProof,
				"monthlyProof",
				`masterProof.id = monthlyProof.masterProofId and monthlyProof.reportingMonth = '${reportingMonth}' and monthlyProof.reportingYear = ${reportingYear} and monthlyProof.status = '${MonthlyProofStatusEnum.REQUESTED}'`
			)
			.select(getMasterProofDataByRefdocIdMonthYearWithMonthlyData)
			.where("masterProof.refdocId = :refdocId", { refdocId })
			.andWhere("masterProof.payeeId = :payeeId", { payeeId })
			.andWhere("masterProof.status = :masterProofStatus", { masterProofStatus: ProofStatus.APPROVED })
			.groupBy("masterProof.id,paymentValidationDocMapping.payment_type_name")
			.getRawMany();
	}

	async getMasterProofDataByRefdocIdMonthYearWithDisputeData(
		refdocId: number,
		reportingMonth: string,
		reportingYear: number,
		payeeId: number
	) {
		return await this.dataSource
			.getRepository(ValidationDocMasterProof)
			.createQueryBuilder("masterProof")
			.innerJoin(
				PaymentValidationdocMapping,
				"paymentValidationDocMapping",
				"paymentValidationDocMapping.paymentType = masterProof.paymentType"
			)
			.leftJoin(
				DisputeEntity,
				"dispute",
				`masterProof.id = dispute.masterProofId and dispute.reportingMonth = '${reportingMonth}' and dispute.reportingYear = ${reportingYear} and dispute.status <> '${DisputeStatusEnum.CLOSED}'`
			)
			.select(getMasterProofDataByRefdocIdMonthYearWithDisputeData)
			.where("masterProof.refdocId = :refdocId", { refdocId })
			.andWhere("masterProof.payeeId = :payeeId", { payeeId })
			.andWhere("masterProof.status = :masterProofStatus", { masterProofStatus: ProofStatus.APPROVED })
			.andWhere("masterProof.masterProofType <> :masterProofType", { masterProofType: MasterProofTypeEnum.PLAID })
			.groupBy("masterProof.id,paymentValidationDocMapping.payment_type_name")
			.getRawMany();
	}

	async getMonthlyProofsOfPayeeByRefdocId(payeeId: number, refdocId: number, monthlyProofIds: number[]) {
		const queryBuilder = this.dataSource
			.createQueryBuilder(ValidationDocMasterProof, "masterProof")
			.innerJoin(ValidationDocMonthlyProof, "monthlyProof", "masterProof.id = monthlyProof.masterProofId")
			.innerJoin(StatusMasterEntity, "monthlyStatusMaster", "monthlyStatusMaster.status = monthlyProof.status")
			.innerJoin(
				PaymentValidationdocMapping,
				"paymentValidationDocMapping",
				"paymentValidationDocMapping.paymentType = masterProof.paymentType"
			)
			.leftJoin(
				RefdocRejectionReasonMaster,
				"rejectionReasonMaster",
				"rejectionReasonMaster.id = monthlyProof.rejectedReason"
			)
			.select(getMonthlyProofsOfPayeeByRefdocId)
			.where("masterProof.refdocId = :refdocId", { refdocId })
			.andWhere("masterProof.payeeId = :payeeId", { payeeId });
		if (monthlyProofIds?.length) {
			queryBuilder
				.addSelect(
					`CASE
						 WHEN monthlyProof.id IN (:...monthlyProofIds) AND (monthlyProof.status = 'REQUESTED' OR monthlyProof.status = 'QUALIFIED') THEN 'Reuploaded'
						 WHEN monthlyProof.id NOT IN (:...monthlyProofIds) AND (monthlyProof.status = 'REQUESTED' OR monthlyProof.status = 'QUALIFIED') THEN 'Newly Uploaded'
						 ELSE monthlyStatusMaster.description
						 END`,
					"monthlyProofStatusDesc"
				)
				.setParameter("monthlyProofIds", monthlyProofIds);
		}
		return await queryBuilder.orderBy("monthlyProof.createdAt", "DESC").getRawMany();
	}

	async getMonthlyProofNameByMasterProofId(masterProofId: number) {
		return await this.dataSource
			.createQueryBuilder(ValidationDocMonthlyProof, "monthlyProof")
			.innerJoin(ValidationDocMasterProof, "masterProof", "masterProof.id = monthlyProof.masterProofId")
			.innerJoin(
				PaymentValidationdocMapping,
				"paymentValidationDocMapping",
				"paymentValidationDocMapping.paymentType = masterProof.paymentType"
			)
			.select(getMonthlyProofNameByMasterProofId)
			.where("monthlyProof.masterProofId = :masterProofId", { masterProofId })
			.getRawOne();
	}

	async getPlaidMonthlyProofDataForLookBack(status: MonthlyProofStatusEnum) {
		return await this.dataSource
			.getRepository(ValidationDocMonthlyProof)
			.createQueryBuilder("monthlyProof")
			.innerJoin(ValidationDocMasterProof, "masterProof", "masterProof.id = monthlyProof.masterProofId")
			.innerJoin(PlaidLinkTokens, "plaidLinkTokens", "plaidLinkTokens.id = masterProof.plaidTokenId")
			.select(getPlaidMonthlyProofDataForLookBack)
			.where("monthlyProof.status = :status", { status })
			.andWhere("monthlyProof.monthlyProofType = :monthlyProofType", {
				monthlyProofType: MonthlyProofTypeEnum.TRANSACTION
			})
			.getRawMany();
	}

	async getVerifiedProofs(refdocId: number, reportingMonth: string, reportingYear: string) {
		return await this.dataSource
			.createQueryBuilder(MonthlyVerifiedProofsEntity, "verifiedProofs")
			.innerJoin(ValidationDocMasterProof, "masterProof", "masterProof.id = verifiedProofs.masterProofId")
			.innerJoin(
				PaymentValidationdocMapping,
				"paymentValidationDocMapping",
				"paymentValidationDocMapping.paymentType = masterProof.paymentType"
			)
			.innerJoin(UserMasterEntity, "payeeUser", "payeeUser.userId = masterProof.payeeId")
			.select(GetVerifiedProofs)
			.where("masterProof.refdocId = :refdocId", { refdocId })
			.andWhere("verifiedProofs.reportingMonth = :reportingMonth", { reportingMonth })
			.andWhere("verifiedProofs.reportingYear = :reportingYear", { reportingYear })
			.andWhere("verifiedProofs.status = :status", { status: VerifiedProofStatusEnum.APPROVED })
			.getRawMany();
	}

	async getNonCrediotrListByCrediotr(creditor: string) {
		const nonCreditorData = await this.dataSource.getRepository(NonCreditorList).findOne({
			where: {
				creditor
			}
		});
		return nonCreditorData;
	}

	async getNonCrediotrList() {
		const nonCreditorData = await this.dataSource.getRepository(NonCreditorList).find({});
		return nonCreditorData;
	}

	async getLeaseSpecificNonCreditorList(refdocIds: number[]) {
		return await this.dataSource.getRepository(LeaseSpecificNonCreditorList).find({
			where: {
				refdocId: In(refdocIds)
			}
		});
	}

	async getLeaseSpecificNonCreditorByCreditor(refdocId: number, creditor: string) {
		return await this.dataSource.getRepository(LeaseSpecificNonCreditorList).findOne({
			where: {
				refdocId,
				creditor
			}
		});
	}

	async getLeaseSpecificNonCreditorsByCreditor(refdocIds: number[], creditor: string) {
		return await this.dataSource.getRepository(LeaseSpecificNonCreditorList).find({
			where: {
				refdocId: In(refdocIds),
				creditor
			}
		});
	}

	async saveNonCreditorListFromQueryRunner(queryRunner: QueryRunner, nonCreditorList: NonCreditorList) {
		return await queryRunner.manager.getRepository(NonCreditorList).save(nonCreditorList);
	}

	async saveLeaseSpecificNonCreditorListFromQueryRunner(
		queryRunner: QueryRunner,
		nonCreditorList: LeaseSpecificNonCreditorList
	) {
		return await queryRunner.manager.getRepository(LeaseSpecificNonCreditorList).save(nonCreditorList);
	}

	async saveLeaseSpecificNonCreditorList(nonCreditorList: LeaseSpecificNonCreditorList) {
		return await this.dataSource.getRepository(LeaseSpecificNonCreditorList).save(nonCreditorList);
	}

	async saveMultipleLeaseSpecificNonCreditorList(nonCreditorList: LeaseSpecificNonCreditorList[]) {
		return await this.dataSource.getRepository(LeaseSpecificNonCreditorList).save(nonCreditorList);
	}

	async getStatusDisplayNameFromDropdownTable(option: string) {
		const statusData = await this.dataSource.getRepository(DropdownOption).findOne({ where: { option } });
		if (!statusData) {
			throw new HttpException({ status: ResponseData.INVALID_STATUS }, HttpStatus.OK);
		}
		return statusData.value;
	}

	async getPendingManualPayments(refdocId: number, monthArr, yearArr) {
		return await this.dataSource
			.getRepository(ValidationDocMasterProof)
			.createQueryBuilder("masterProof")
			.innerJoin(ValidationDocMonthlyProof, "monthlyProof", "monthlyProof.masterProofId = masterProof.id")
			.select([
				"COUNT(monthlyProof.id) as pendingManualPayments, monthlyProof.reportingMonth as reportingMonth, monthlyProof.reportingYear as reportingYear"
			])
			.where("masterProof.refdocId = :refdocId", { refdocId })
			.andWhere("masterProof.masterProofType != :masterProofType", { masterProofType: MasterProofTypeEnum.PLAID })
			.andWhere("monthlyProof.reportingMonth IN (:...monthArr)", { monthArr })
			.andWhere("monthlyProof.reportingYear IN (:...yearArr)", { yearArr })
			.andWhere("monthlyProof.status = :status", { status: MonthlyProofStatusEnum.REQUESTED })
			.groupBy("monthlyProof.reportingMonth, monthlyProof.reportingYear")
			.getRawMany();
	}

	async getVerifiedProofsByMasterProofMonthAndYear(masterProofId: number, reportingMonth: string, reportingYear: number) {
		return await this.dataSource.getRepository(MonthlyVerifiedProofsEntity).find({
			where: {
				masterProofId: masterProofId,
				reportingMonth: reportingMonth,
				reportingYear: reportingYear,
				status: VerifiedProofStatusEnum.APPROVED
			}
		});
	}

	async getPaymentScheduleByMonthlyProofIds(monthlyProofIds: number[]) {
		return await this.dataSource
			.getRepository(ValidationDocMonthlyProof)
			.createQueryBuilder("monthlyProof")
			.innerJoin(ValidationDocMasterProof, "masterProof", "masterProof.id = monthlyProof.masterProofId")
			.innerJoin(
				PaymentSchedule,
				"schedule",
				"schedule.leaseId = masterProof.refdocId AND schedule.month = monthlyProof.reportingMonth AND schedule.year = monthlyProof.reportingYear"
			)
			.select(["schedule.amount as amount", "monthlyProof.id as monthlyProofId", "schedule.leaseId as leaseId"])
			.where("monthlyProof.id IN (:...monthlyProofIds)", { monthlyProofIds })
			.getRawMany();
	}

	async saveMultipleCreditorUpdatesAsync(creditorUpdatesAsyncArr: CreditorUpdatesAsync[], queryRunner: QueryRunner) {
		await queryRunner.manager.getRepository(CreditorUpdatesAsync).save(creditorUpdatesAsyncArr);
	}

	async getCreditorUpdatesAsync() {
		return await this.dataSource.getRepository(CreditorUpdatesAsync).find({
			where: {
				status: StatusEnum.NEW
			}
		});
	}
}
