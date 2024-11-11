import { DisputeEntity, DisputeStatusEnum } from "@modules/dispute/entities/dispute.entity";
import { RefdocMaster, RefdocMasterStatusEnum } from "@modules/doc/entities/refdoc-master.entity";
import { RefdocTypeMaster } from "@modules/doc/entities/refdoc-type-master.entity";
import { ProofStatus, ValidationDocMasterProof } from "@modules/doc/entities/validation-doc-master-proof.entity";
import { ValidationDocMonthlyProof } from "@modules/monthly-proof/entities/validation-doc-monthly-proof.entity";
import { UserSubscriptionTransactions } from "@modules/package/entities/user-subscription-txn.entity";
import { UserMasterEntity } from "@modules/user-master/entities/user-master.entity";
import { Injectable } from "@nestjs/common";
import { MonthlyProofStatusEnum, PaymentStatusEnum, YesNoEnum } from "@utils/enums/Status";
import { DocumentTypeEnum } from "@utils/enums/constants";
import { MonthlyProofTypeEnum } from "@utils/enums/txn-types";
import { UserType } from "@utils/enums/user-types";
import { DataSource } from "typeorm";

@Injectable()
export class DashboardDaoService {
	constructor(private dataSource: DataSource) {}

	async getWeeklySubscriptionData(startDate: Date, endDate: Date, status: PaymentStatusEnum, boolStatus: YesNoEnum) {
		return await this.dataSource
			.getRepository(UserSubscriptionTransactions)
			.createQueryBuilder("subscription")
			.select("DATE(subscription.createdAt) as day, COUNT(subscription.id) as value")
			.where("subscription.createdAt BETWEEN :startDate AND :endDate", { startDate, endDate })
			.andWhere("subscription.status = :status", { status })
			.andWhere("subscription.isFirstSubscription = :boolStatus", { boolStatus })
			.groupBy("day")
			.getRawMany();
	}

	async getUsersRegisteredOfWeek(startDate: Date, endDate: Date) {
		return await this.dataSource
			.getRepository(UserMasterEntity)
			.createQueryBuilder("user")
			.select("COUNT(user.userId) as weekData")
			.where("user.createdAt BETWEEN :startDate AND :endDate", { startDate, endDate })
			.andWhere(`(user.userType = :userType)`, {
				userType: UserType.CONSUMER
			})
			.getRawOne();
	}

	async getSubscriptionDataOfWeek(startDate: Date, endDate: Date, status: PaymentStatusEnum, boolStatus: YesNoEnum) {
		return await this.dataSource
			.getRepository(UserSubscriptionTransactions)
			.createQueryBuilder("subscription")
			.select("COUNT(subscription.id) as weekData")
			.where("subscription.createdAt BETWEEN :startDate AND :endDate", { startDate, endDate })
			.andWhere("subscription.status = :status", { status })
			.andWhere("subscription.isFirstSubscription = :boolStatus", { boolStatus })
			.getRawOne();
	}

	async getSubscriptionAmountDataOfWeek(startDate: Date, endDate: Date, status: PaymentStatusEnum, boolStatus: YesNoEnum) {
		return await this.dataSource
			.getRepository(UserSubscriptionTransactions)
			.createQueryBuilder("subscription")
			.select("SUM(subscription.paymentAmount) as weekData")
			.where("subscription.createdAt BETWEEN :startDate AND :endDate", { startDate, endDate })
			.andWhere("subscription.status = :status", { status })
			.andWhere("subscription.isFirstSubscription = :boolStatus", { boolStatus })
			.getRawOne();
	}

	async getRefdocUploadDataOfWeek(startDate: Date, endDate: Date) {
		return await this.dataSource
			.getRepository(RefdocMaster)
			.createQueryBuilder("refdocMaster")
			.select("COUNT(refdocMaster.refdocId) as weekData")
			.where("refdocMaster.uploadedDate BETWEEN :startDate AND :endDate", { startDate, endDate })
			.getRawOne();
	}

	async getRefdocVerifiedDataOfWeek(startDate: Date, endDate: Date) {
		return await this.dataSource
			.getRepository(RefdocMaster)
			.createQueryBuilder("refdocMaster")
			.select("COUNT(refdocMaster.refdocId) as weekData")
			.where("refdocMaster.verifiedAt BETWEEN :startDate AND :endDate", { startDate, endDate })
			.getRawOne();
	}

	async getDisputeRaisedDataOfWeek(startDate: Date, endDate: Date) {
		return await this.dataSource
			.getRepository(DisputeEntity)
			.createQueryBuilder("dispute")
			.select("COUNT(dispute.disputeId) as weekData")
			.where("dispute.createdAt BETWEEN :startDate AND :endDate", { startDate, endDate })
			.getRawOne();
	}

	async getDisputeClosedDataOfWeek(startDate: Date, endDate: Date) {
		return await this.dataSource
			.getRepository(DisputeEntity)
			.createQueryBuilder("dispute")
			.select("COUNT(dispute.disputeId) as weekData")
			.where("dispute.updatedAt BETWEEN :startDate AND :endDate", { startDate, endDate })
			.andWhere("dispute.status = :status", { status: DisputeStatusEnum.CLOSED })
			.getRawOne();
	}

	async getMonthlySubscriptionData(startDate: Date, endDate: Date, status: PaymentStatusEnum, boolStatus: YesNoEnum) {
		return await this.dataSource
			.getRepository(UserSubscriptionTransactions)
			.createQueryBuilder("subscription")
			.select("MONTHNAME(subscription.createdAt) as month, COUNT(subscription.id) as value")
			.where("subscription.createdAt BETWEEN :startDate AND :endDate", { startDate, endDate })
			.andWhere("subscription.status = :status", { status })
			.andWhere("subscription.isFirstSubscription = :boolStatus", { boolStatus })
			.groupBy("month")
			.getRawMany();
	}

	async getWeeklySubscriptionAmountData(startDate: Date, endDate: Date, status: PaymentStatusEnum, boolStatus: YesNoEnum) {
		return await this.dataSource
			.getRepository(UserSubscriptionTransactions)
			.createQueryBuilder("subscription")
			.select("DATE(subscription.createdAt) as day, SUM(subscription.paymentAmount) as value")
			.where("subscription.createdAt BETWEEN :startDate AND :endDate", { startDate, endDate })
			.andWhere("subscription.status = :status", { status })
			.andWhere("subscription.isFirstSubscription = :boolStatus", { boolStatus })
			.groupBy("day")
			.getRawMany();
	}

	async getMonthlySubscriptionAmountData(
		startDate: Date,
		endDate: Date,
		status: PaymentStatusEnum,
		boolStatus: YesNoEnum
	) {
		return await this.dataSource
			.getRepository(UserSubscriptionTransactions)
			.createQueryBuilder("subscription")
			.select("MONTHNAME(subscription.createdAt) as month, SUM(subscription.paymentAmount) as value")
			.where("subscription.createdAt BETWEEN :startDate AND :endDate", { startDate, endDate })
			.andWhere("subscription.status = :status", { status })
			.andWhere("subscription.isFirstSubscription = :boolStatus", { boolStatus })
			.groupBy("month")
			.getRawMany();
	}

	async getYearlySubscriptionAmountData(startDate: Date, endDate: Date, status: PaymentStatusEnum, boolStatus: YesNoEnum) {
		return await this.dataSource
			.getRepository(UserSubscriptionTransactions)
			.createQueryBuilder("subscription")
			.select("YEAR(subscription.createdAt) as year, SUM(subscription.paymentAmount) as value")
			.where("subscription.createdAt BETWEEN :startDate AND :endDate", { startDate, endDate })
			.andWhere("subscription.status = :status", { status })
			.andWhere("subscription.isFirstSubscription = :boolStatus", { boolStatus })
			.groupBy("year")
			.getRawMany();
	}

	async getWeeklyUsersRegistered(startDate: Date, endDate: Date) {
		return await this.dataSource
			.getRepository(UserMasterEntity)
			.createQueryBuilder("user")
			.select("DATE(user.createdAt) as day, COUNT(user.userId) as value")
			.where("user.createdAt BETWEEN :startDate AND :endDate", { startDate, endDate })
			.andWhere(`(user.userType = :userType)`, {
				userType: UserType.CONSUMER
			})
			.groupBy("day")
			.getRawMany();
	}

	async getMonthlyUsersRegistererd(startDate: Date, endDate: Date) {
		return await this.dataSource
			.getRepository(UserMasterEntity)
			.createQueryBuilder("user")
			.select("MONTHNAME(user.createdAt) as month, COUNT(user.userId) as value")
			.where("user.createdAt BETWEEN :startDate AND :endDate", { startDate, endDate })
			.andWhere(`(user.userType = :userType)`, {
				userType: UserType.CONSUMER
			})
			.groupBy("month")
			.getRawMany();
	}

	async getWeeklyRefdocUploadData(startDate: Date, endDate: Date) {
		return await this.dataSource
			.getRepository(RefdocMaster)
			.createQueryBuilder("refdocMaster")
			.select("DATE(refdocMaster.uploadedDate) as day, COUNT(refdocMaster.refdocId) as value")
			.where("refdocMaster.uploadedDate BETWEEN :startDate AND :endDate", { startDate, endDate })
			.groupBy("day")
			.getRawMany();
	}

	async getMonthlyRefdocUploadData(startDate: Date, endDate: Date) {
		return await this.dataSource
			.getRepository(RefdocMaster)
			.createQueryBuilder("refdocMaster")
			.select("MONTHNAME(refdocMaster.uploadedDate) as month, COUNT(refdocMaster.refdocId) as value")
			.where("refdocMaster.uploadedDate BETWEEN :startDate AND :endDate", { startDate, endDate })
			.groupBy("month")
			.getRawMany();
	}

	async getYearlyRefdocUploadData(startDate: Date, endDate: Date) {
		return await this.dataSource
			.getRepository(RefdocMaster)
			.createQueryBuilder("refdocMaster")
			.select("YEAR(refdocMaster.uploadedDate) as year, COUNT(refdocMaster.refdocId) as value")
			.where("refdocMaster.uploadedDate BETWEEN :startDate AND :endDate", { startDate, endDate })
			.groupBy("year")
			.getRawMany();
	}

	async getWeeklyRefdocVerifiedData(startDate: Date, endDate: Date) {
		return await this.dataSource
			.getRepository(RefdocMaster)
			.createQueryBuilder("refdocMaster")
			.select("DATE(refdocMaster.verifiedAt) as day, COUNT(refdocMaster.refdocId) as value")
			.where("refdocMaster.verifiedAt BETWEEN :startDate AND :endDate", { startDate, endDate })
			.groupBy("day")
			.getRawMany();
	}

	async getYearlyRefdocVerifiedData(startDate: Date, endDate: Date) {
		return await this.dataSource
			.getRepository(RefdocMaster)
			.createQueryBuilder("refdocMaster")
			.select("YEAR(refdocMaster.verifiedAt) as year, COUNT(refdocMaster.refdocId) as value")
			.where("refdocMaster.verifiedAt BETWEEN :startDate AND :endDate", { startDate, endDate })
			.groupBy("year")
			.getRawMany();
	}

	async getMonthlyRefdocVerifiedData(startDate: Date, endDate: Date) {
		return await this.dataSource
			.getRepository(RefdocMaster)
			.createQueryBuilder("refdocMaster")
			.select("MONTHNAME(refdocMaster.verifiedAt) as month, COUNT(refdocMaster.refdocId) as value")
			.where("refdocMaster.verifiedAt BETWEEN :startDate AND :endDate", { startDate, endDate })
			.groupBy("month")
			.getRawMany();
	}

	async getWeeklyDisputeRaisedData(startDate: Date, endDate: Date) {
		return await this.dataSource
			.getRepository(DisputeEntity)
			.createQueryBuilder("dispute")
			.select("DATE(dispute.createdAt) as day, COUNT(dispute.disputeId) as value")
			.where("dispute.createdAt BETWEEN :startDate AND :endDate", { startDate, endDate })
			.groupBy("day")
			.getRawMany();
	}

	async getYearlyDisputeRaisedData(startDate: Date, endDate: Date) {
		return await this.dataSource
			.getRepository(DisputeEntity)
			.createQueryBuilder("disputeEntity")
			.select("YEAR(disputeEntity.createdAt) as year, COUNT(disputeEntity.disputeId) as value")
			.where("disputeEntity.createdAt BETWEEN :startDate AND :endDate", { startDate, endDate })
			.groupBy("year")
			.getRawMany();
	}

	async getMonthlyDisputeRaisedData(startDate: Date, endDate: Date) {
		return await this.dataSource
			.getRepository(DisputeEntity)
			.createQueryBuilder("disputeEntity")
			.select("MONTHNAME(disputeEntity.createdAt) as month, COUNT(disputeEntity.disputeId) as value")
			.where("disputeEntity.createdAt BETWEEN :startDate AND :endDate", { startDate, endDate })
			.groupBy("month")
			.getRawMany();
	}

	async getWeeklyDisputeClosedData(startDate: Date, endDate: Date) {
		return await this.dataSource
			.getRepository(DisputeEntity)
			.createQueryBuilder("dispute")
			.select("DATE(dispute.updatedAt) as day, COUNT(dispute.disputeId) as value")
			.where("dispute.updatedAt BETWEEN :startDate AND :endDate", { startDate, endDate })
			.andWhere("dispute.status = :status", { status: DisputeStatusEnum.CLOSED })
			.groupBy("day")
			.getRawMany();
	}

	async getYearlyDisputeClosedData(startDate: Date, endDate: Date) {
		return await this.dataSource
			.getRepository(DisputeEntity)
			.createQueryBuilder("disputeEntity")
			.select("YEAR(disputeEntity.createdAt) as year, COUNT(disputeEntity.disputeId) as value")
			.where("disputeEntity.updatedAt BETWEEN :startDate AND :endDate", { startDate, endDate })
			.andWhere("disputeEntity.status = :status", { status: DisputeStatusEnum.CLOSED })
			.groupBy("year")
			.getRawMany();
	}

	async getMonthlyDisputeClosedData(startDate: Date, endDate: Date) {
		return await this.dataSource
			.getRepository(DisputeEntity)
			.createQueryBuilder("disputeEntity")
			.select("MONTHNAME(disputeEntity.createdAt) as month, COUNT(disputeEntity.disputeId) as value")
			.where("disputeEntity.updatedAt BETWEEN :startDate AND :endDate", { startDate, endDate })
			.andWhere("disputeEntity.status = :status", { status: DisputeStatusEnum.CLOSED })
			.groupBy("month")
			.getRawMany();
	}

	async getRefdocPendingByDocumentType(documentType: DocumentTypeEnum) {
		return await this.dataSource
			.getRepository(RefdocMaster)
			.createQueryBuilder("refdocMaster")
			.innerJoin(RefdocTypeMaster, "refdocType", "refdocType.refdocTypeId = refdocMaster.refdocTypeId")
			.select("COUNT(refdocMaster.refdocId) as pendingRefdocs")
			.where("refdocMaster.status = :status", { status: RefdocMasterStatusEnum.REQUESTED })
			.andWhere("refdocType.documentType = :documentType", { documentType })
			.groupBy("refdocMaster.status")
			.getRawOne();
	}

	async getRefdocProposedToApproveByDocumentType(documentType: DocumentTypeEnum) {
		return await this.dataSource
			.getRepository(RefdocMaster)
			.createQueryBuilder("refdocMaster")
			.innerJoin(RefdocTypeMaster, "refdocType", "refdocType.refdocTypeId = refdocMaster.refdocTypeId")
			.select("COUNT(refdocMaster.refdocId) as proposedToApproveRefdocs")
			.where("refdocMaster.status = :status", { status: RefdocMasterStatusEnum.PROPOSED_TO_APPROVE })
			.andWhere("refdocType.documentType = :documentType", { documentType })
			.groupBy("refdocMaster.status")
			.getRawOne();
	}

	async getPendingMasterProofs() {
		return await this.dataSource
			.getRepository(ValidationDocMasterProof)
			.createQueryBuilder("masterProof")
			.innerJoin(RefdocMaster, "refdoc", "refdoc.refdocId = masterProof.refdocId")
			.select("COUNT(masterProof.id) as pendingMasterProofs")
			.where("masterProof.status = :masterProofStatus", { masterProofStatus: ProofStatus.REQUESTED })
			.andWhere("refdoc.status = :refdocStatus", { refdocStatus: ProofStatus.APPROVED })
			.getRawOne();
	}

	async getPendingMonthlyProofsByMonthlyProofType(monthlyProofType: MonthlyProofTypeEnum) {
		return await this.dataSource
			.getRepository(ValidationDocMonthlyProof)
			.createQueryBuilder("monthlyProof")
			.select("COUNT(monthlyProof.id) as pendingMonthlyProofs")
			.where("monthlyProof.status = :status", { status: MonthlyProofStatusEnum.REQUESTED })
			.andWhere("monthlyProof.monthlyProofType = :monthlyProofType", {
				monthlyProofType
			})
			.groupBy("monthlyProof.status")
			.getRawOne();
	}

	async getPendingDisputes() {
		return await this.dataSource
			.getRepository(DisputeEntity)
			.createQueryBuilder("dispute")
			.select("COUNT(dispute.disputeId) as pendingDisputes")
			.where("dispute.status = :status", { status: DisputeStatusEnum.CRYR_ACTION_PENDING })
			.groupBy("dispute.status")
			.getRawOne();
	}
}
