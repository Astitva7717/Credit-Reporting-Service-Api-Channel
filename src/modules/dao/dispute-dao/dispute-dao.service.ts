import { GetDisputeDto } from "@modules/dispute/dto/get-disputes.dto";
import { DisputeHistoryEntity } from "@modules/dispute/entities/dispute-history.entity";
import { DisputeTypeMaster, DisputeTypeStatusEnum } from "@modules/dispute/entities/dispute-type-master.entity";
import { DisputeEntity, DisputeStatusEnum } from "@modules/dispute/entities/dispute.entity";
import { PaymentSchedule } from "@modules/doc/entities/payment-schedule.entity";
import { PaymentValidationdocMapping } from "@modules/doc/entities/payment-validationdoc-mapping.entity";
import { RefdocMaster } from "@modules/doc/entities/refdoc-master.entity";
import { RefdocTypeMaster } from "@modules/doc/entities/refdoc-type-master.entity";
import { StatusMasterEntity } from "@modules/doc/entities/status-master.entity";
import { ValidationDocMasterProof } from "@modules/doc/entities/validation-doc-master-proof.entity";
import { ValidationDocMonthlyProof } from "@modules/monthly-proof/entities/validation-doc-monthly-proof.entity";
import { UserMasterEntity } from "@modules/user-master/entities/user-master.entity";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import {
	GetDisputesFilteredData,
	GetUserInfo,
	getDisputeDataById,
	getDisputeDataByRefdocIdAndRaisedById,
	getDisputeFullDetailsFromDisputeHistoryId,
	getDisputeHistoryByDisputeId
} from "@utils/constants/querry-constants";
import { ResponseData } from "@utils/enums/response";
import { DataSource, Not, QueryRunner } from "typeorm";

@Injectable()
export class DisputeDaoService {
	constructor(private dataSource: DataSource) {}

	async getActiveDisputesByMasterProofIdAndRaisedBy(masterProofId: number, raisedBy: number) {
		return await this.dataSource.getRepository(DisputeEntity).findOne({
			where: {
				raisedBy,
				masterProofId,
				status: Not(DisputeStatusEnum.CLOSED)
			}
		});
	}

	async createDispute(disputeEntity: DisputeEntity) {
		return await this.dataSource.getRepository(DisputeEntity).save(disputeEntity);
	}

	async createDisputeByQueryRunner(queryRunner: QueryRunner, disputeEntity: DisputeEntity) {
		return await this.dataSource.getRepository(DisputeEntity).save(disputeEntity);
	}

	async insertDisputeHistory(disputeHistoryEntity: DisputeHistoryEntity) {
		return await this.dataSource.getRepository(DisputeHistoryEntity).save(disputeHistoryEntity);
	}

	async saveDisputeHistoryFromQueryRunner(queryRunner: QueryRunner, disputeHistoryEntity: DisputeHistoryEntity) {
		return await queryRunner.manager.getRepository(DisputeHistoryEntity).save(disputeHistoryEntity);
	}

	async getDisputesFilteredData(getDisputeDto: GetDisputeDto) {
		let { page, limit, disputeStatus, monthlyProofStatus, reason, refdocId, name, emailId, mobileNo, paymentType, disputeId } = getDisputeDto;
		if (!page) page = 1;
		if (!limit) limit = 20;
		const offset = (page - 1) * limit;
		let queryBuilder = this.dataSource
			.getRepository(DisputeEntity)
			.createQueryBuilder("disputeEntity")
			.innerJoin(StatusMasterEntity, "disputeStatusMaster", "disputeStatusMaster.status = disputeEntity.status")
			.innerJoin(DisputeTypeMaster, "disputeType", "disputeType.id = disputeEntity.disputeType")
			.innerJoin(ValidationDocMasterProof, "masterProof", "masterProof.id = disputeEntity.masterProofId")
			.innerJoin(PaymentSchedule, "schedule", "schedule.year = disputeEntity.reportingYear AND schedule.month = disputeEntity.reportingMonth AND schedule.leaseId = masterProof.refdocId")
			.innerJoin(RefdocMaster, "refdocMaster", "refdocMaster.refdocId = masterProof.refdocId")
			.innerJoin(UserMasterEntity, "users", "users.userId = disputeEntity.raisedBy")
			.innerJoin(RefdocTypeMaster, "refdocType", "refdocMaster.refdocTypeId = refdocType.refdocTypeId")
			.innerJoin(
				PaymentValidationdocMapping,
				"paymentdocMapping",
				"paymentdocMapping.paymentType = masterProof.paymentType"
			)
			.select(GetDisputesFilteredData)
			.where(`(:disputeId IS NULL OR disputeEntity.disputeId = :disputeId)`, { disputeId })
			.andWhere(`(:disputeStatus IS NULL OR disputeEntity.status = :disputeStatus)`, { disputeStatus })
			.andWhere(`(:monthlyProofStatus IS NULL OR schedule.status = :monthlyProofStatus)`, { monthlyProofStatus })
			.andWhere(`(:refdocId IS NULL OR refdocMaster.refdocId = :refdocId)`, { refdocId })
			.andWhere(`(:name IS NULL OR CONCAT(users.firstName, ' ', users.lastName) LIKE :name)`, {
				name: `%${name || ""}%`
			})
			.andWhere(`(:paymentType IS NULL OR masterProof.paymentType = :paymentType)`, { paymentType })
			.andWhere(`(:reason IS NULL OR disputeType.type = :reason)`, { reason })
			.andWhere(`(:emailId IS NULL OR users.emailId = :emailId)`, { emailId })
			.andWhere(`(:mobileNo IS NULL OR users.mobileNo = :mobileNo)`, { mobileNo });

		const total = await queryBuilder.getCount();
		const disputeData = await queryBuilder
			.orderBy("disputeEntity.updatedAt", "ASC")
			.offset(offset)
			.limit(limit)
			.getRawMany();
		if (!disputeData?.length) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return { disputeData, total };
	}

	async getDisputeDataById(disputeId: number) {
		const dispute = await this.dataSource
			.getRepository(DisputeEntity)
			.createQueryBuilder("dispute")
			.innerJoin(UserMasterEntity, "users", "users.userId = dispute.raisedBy")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = dispute.status")
			.innerJoin(DisputeTypeMaster, "disputeType", "disputeType.id = dispute.disputeType")
			.innerJoin(ValidationDocMasterProof, "masterProof", "masterProof.id = dispute.masterProofId")
			.innerJoin(RefdocMaster, "refdocMaster", "refdocMaster.refdocId = masterProof.refdocId")
			.innerJoin(RefdocTypeMaster, "refdocType", "refdocMaster.refdocTypeId = refdocType.refdocTypeId")
			.innerJoin(PaymentSchedule, "schedule", "schedule.year = dispute.reportingYear AND schedule.month = dispute.reportingMonth AND schedule.leaseId = masterProof.refdocId")
			.innerJoin(StatusMasterEntity, "statusMasterNew", "statusMasterNew.status = schedule.status")
			.innerJoin(
				PaymentValidationdocMapping,
				"paymentdocMapping",
				"paymentdocMapping.paymentType = masterProof.paymentType"
			)
			.select(getDisputeDataById)
			.where({
				disputeId
			})
			.getRawOne();
		if (!dispute) {
			throw new HttpException({ status: ResponseData.INVALID_DISPUTE_ID }, HttpStatus.OK);
		}
		return dispute;
	}

	async getDisputeHistoryByDisputeId(disputeId: number) {
		return await this.dataSource
			.getRepository(DisputeHistoryEntity)
			.createQueryBuilder("disputeHistory")
			.innerJoin(UserMasterEntity, "users", "users.userId = disputeHistory.createdBy")
			.select(getDisputeHistoryByDisputeId)
			.where({
				disputeId
			})
			.orderBy("id", "ASC")
			.getRawMany();
	}

	async getDisputeDataByIdAndRaisedById(disputeId: number, raisedBy: number) {
		const dispute = await this.dataSource
			.getRepository(DisputeEntity)
			.createQueryBuilder("dispute")
			.innerJoin(UserMasterEntity, "users", "users.userId = dispute.raisedBy")
			.innerJoin(DisputeTypeMaster, "disputeType", "disputeType.id = dispute.disputeType")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = dispute.status")
			.innerJoin(ValidationDocMasterProof, "masterProof", "masterProof.id = dispute.masterProofId")
			.innerJoin(RefdocMaster, "refdocMaster", "refdocMaster.refdocId = masterProof.refdocId")
			.innerJoin(RefdocTypeMaster, "refdocType", "refdocMaster.refdocTypeId = refdocType.refdocTypeId")
			.innerJoin(
				PaymentValidationdocMapping,
				"paymentdocMapping",
				"paymentdocMapping.paymentType = masterProof.paymentType"
			)
			.innerJoin(PaymentSchedule, "schedule", "schedule.year = dispute.reportingYear AND schedule.month = dispute.reportingMonth AND schedule.leaseId = masterProof.refdocId")
			.innerJoin(StatusMasterEntity, "statusMasterNew", "statusMasterNew.status = schedule.status")
			.select(getDisputeDataById)
			.where({
				disputeId,
				raisedBy
			})
			.getRawOne();
		if (!dispute) {
			throw new HttpException({ status: ResponseData.INVALID_DISPUTE_ID }, HttpStatus.OK);
		}
		return dispute;
	}

	async getActiveDisputeTypes() {
		const disputeTypes = await this.dataSource.getRepository(DisputeTypeMaster).find({
			where: {
				status: DisputeTypeStatusEnum.ACTIVE
			}
		});
		if (!disputeTypes.length) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return disputeTypes;
	}

	async getActiveDisputeTypeById(id: number) {
		const disputeType = await this.dataSource.getRepository(DisputeTypeMaster).findOne({
			where: {
				id,
				status: DisputeTypeStatusEnum.ACTIVE
			}
		});
		if (!disputeType) {
			throw new HttpException({ status: ResponseData.INVALID_DISPUTE_TYPE_ID }, HttpStatus.OK);
		}
		return disputeType;
	}

	async getActiveDisputeDataByIdAndRaisedById(disputeId: number, raisedBy: number) {
		const dispute = await this.dataSource.getRepository(DisputeEntity).findOne({
			where: {
				disputeId,
				raisedBy,
				status: Not(DisputeStatusEnum.CLOSED)
			}
		});
		if (!dispute) {
			throw new HttpException({ status: ResponseData.INVALID_DISPUTE_ID }, HttpStatus.OK);
		}
		return dispute;
	}

	async getActiveDisputeDataByDisputId(disputeId: number) {
		const dispute = await this.dataSource.getRepository(DisputeEntity).findOne({
			where: {
				disputeId,
				status: Not(DisputeStatusEnum.CLOSED)
			}
		});
		if (!dispute) {
			throw new HttpException({ status: ResponseData.INVALID_DISPUTE_ID }, HttpStatus.OK);
		}
		return dispute;
	}

	async getDisputeDataByRefdocIdAndRaisedById(raisedBy: number, refdocId: number) {
		return await this.dataSource
			.getRepository(DisputeEntity)
			.createQueryBuilder("dispute")
			.innerJoin(UserMasterEntity, "user", "user.userId = dispute.raisedBy")
			.innerJoin(ValidationDocMasterProof, "masterProof", "masterProof.id = dispute.masterProofId")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = dispute.status")
			.select(getDisputeDataByRefdocIdAndRaisedById)
			.where({
				raisedBy
			})
			.andWhere("masterProof.refdocId = :refdocId", { refdocId })
			.getRawMany();
	}

	async getDisputeFullDetailsFromDisputeHistoryId(disputeHistoryId: number) {
		return await this.dataSource
			.getRepository(DisputeHistoryEntity)
			.createQueryBuilder("disputeHistory")
			.innerJoin(DisputeEntity, "dispute", "disputeHistory.disputeId = dispute.disputeId")
			.innerJoin(ValidationDocMasterProof, "masterProof", "masterProof.id = dispute.masterProofId")
			.innerJoin(
				PaymentValidationdocMapping,
				"paymentdocMapping",
				"paymentdocMapping.paymentType = masterProof.paymentType"
			)
			.select(getDisputeFullDetailsFromDisputeHistoryId)
			.where({
				id: disputeHistoryId
			})
			.getRawOne();
	}

	async updateMonthlyProofForDispute(id: number, updateObj: any) {
		return await this.dataSource.getRepository(ValidationDocMonthlyProof).update({ id }, updateObj);
	}

	async updateDisputeStatus(disputeId: number, status: DisputeStatusEnum) {
		return await this.dataSource.getRepository(DisputeEntity).update({ disputeId }, { status, updatedAt: new Date() });
	}

	async getDisputeDataByRefdocId(refdocId: number) {
		return await this.dataSource
			.getRepository(DisputeEntity)
			.createQueryBuilder("dispute")
			.innerJoin(ValidationDocMasterProof, "masterProof", "masterProof.id = dispute.masterProofId")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = dispute.status")
			.innerJoin(UserMasterEntity, "user", "user.userId = dispute.raisedBy")
			.select(getDisputeDataByRefdocIdAndRaisedById)
			.where("masterProof.refdocId = :refdocId", { refdocId })
			.getRawMany();
	}

	async getDisputeHistoryById(disputeHistoryId: number) {
		return await this.dataSource.getRepository(DisputeHistoryEntity).findOne({
			where: {
				id: disputeHistoryId
			}
		});
	}

	async getUserInfoByDisputeId(disputeId: number) {
		const result: UserMasterEntity = await this.dataSource
			.getRepository(DisputeEntity)
			.createQueryBuilder("dispute")
			.innerJoin(UserMasterEntity, "user", "user.userId = dispute.raisedBy")
			.select(GetUserInfo)
			.where("dispute.disputeId = :disputeId", { disputeId })
			.getRawOne();
		if (!result) {
			throw new HttpException({ status: ResponseData.INVALID_DISPUTE_ID }, HttpStatus.OK);
		}
		return result;
	}

	async getMasterProofDataByDisputeId(disputeId: number) {
		const result = await this.dataSource
			.getRepository(DisputeEntity)
			.createQueryBuilder("dispute")
			.innerJoin(ValidationDocMasterProof, "masterProof", "masterProof.id = dispute.masterProofId")
			.select(["masterProof.refdocId as refdocId","masterProof.paymentType as paymentType"])
			.where("dispute.disputeId = :disputeId", { disputeId })
			.getRawOne();
		if (!result) {
			throw new HttpException({ status: ResponseData.INVALID_DISPUTE_ID }, HttpStatus.OK);
		}
		return result;
	}
}
