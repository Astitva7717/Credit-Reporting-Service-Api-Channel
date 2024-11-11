import { PaymentValidationdocMapping } from "@modules/doc/entities/payment-validationdoc-mapping.entity";
import { RefdocMaster } from "@modules/doc/entities/refdoc-master.entity";
import { RefdocTypeMaster } from "@modules/doc/entities/refdoc-type-master.entity";
import { StatusMasterEntity } from "@modules/doc/entities/status-master.entity";
import { StateMasterEntity } from "@modules/master-data/entities/state-master-entity";
import { PackageMaster } from "@modules/package/entities/package-master.entity";
import { UserSubscriptionTransactions } from "@modules/package/entities/user-subscription-txn.entity";
import { UserMasterEntity } from "@modules/user-master/entities/user-master.entity";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import {
	GetRefdocTypeByPackageId,
	GetSubscriptionTransactionData,
	PaymentHistoryData,
	UsersLastValidTill
} from "@utils/constants/querry-constants";
import { PaymentStatusEnum, Status, SubscriptionPaymentTypeEnum, YesNoEnum } from "@utils/enums/Status";
import { ResponseData } from "@utils/enums/response";
import { Between, DataSource, In, IsNull, LessThan, QueryRunner, UpdateResult } from "typeorm";

@Injectable()
export class PackageDaoService {
	constructor(private readonly dataSource: DataSource) {}

	async getPackageDataByCodeAndStatus(code: string, status: Status) {
		let packageData = await this.dataSource.getRepository(PackageMaster).findOne({
			where: {
				code,
				status
			}
		});
		return packageData;
	}

	async createNewPackage(packageMaster: PackageMaster) {
		return await this.dataSource.getRepository(PackageMaster).save(packageMaster);
	}

	async getAllPackages() {
		return await this.dataSource.getRepository(PackageMaster).find({
			where: {
				status: Status.ACTIVE
			}
		});
	}

	async getPackageById(id: number) {
		let packageData = await this.dataSource.getRepository(PackageMaster).findOne({
			where: {
				packageId: id,
				status: Status.ACTIVE
			}
		});
		return packageData;
	}

	async createUserSubscriptionTxn(userSubscriptionTransactions: UserSubscriptionTransactions) {
		return await this.dataSource.getRepository(UserSubscriptionTransactions).save(userSubscriptionTransactions);
	}

	async createUserSubscriptionTxnByQueryRunner(userSubscriptionTransactions: UserSubscriptionTransactions, queryRunner) {
		return await queryRunner.manager.getRepository(UserSubscriptionTransactions).save(userSubscriptionTransactions);
	}

	async saveUserSubscriptionTxn(userSubscriptionTransactions: UserSubscriptionTransactions[]) {
		return await this.dataSource.getRepository(UserSubscriptionTransactions).save(userSubscriptionTransactions);
	}

	async getUserAllSubscriptionTxnsForRefdoc(userId: number, refdocId: number) {
		let txnData = await this.dataSource.getRepository(UserSubscriptionTransactions).find({
			where: {
				benificiaryUserId: userId,
				refdocId,
				status: PaymentStatusEnum.PAYMENT_DONE
			}
		});
		return txnData;
	}

	async getUserAllSubscriptionTxnsByRefdocId(refdocId: number) {
		let txnData = await this.dataSource.getRepository(UserSubscriptionTransactions).find({
			where: {
				refdocId,
				status: PaymentStatusEnum.PAYMENT_DONE
			}
		});
		return txnData;
	}

	async getSubscriptionForMonthAndYearForRefdoc(refdocId: number, subscriptionMonth: string, subscriptionYear: number) {
		return await this.dataSource.getRepository(UserSubscriptionTransactions).findOne({
			where: {
				refdocId,
				status: PaymentStatusEnum.PAYMENT_DONE,
				subscriptionMonth,
				subscriptionYear
			}
		});
	}

	async getUserSubscriptionForMonthAndYearForRefdoc(
		benificiaryUserId: number,
		refdocId: number,
		subscriptionMonth: string,
		subscriptionYear: number
	) {
		return await this.dataSource.getRepository(UserSubscriptionTransactions).findOne({
			where: {
				benificiaryUserId,
				refdocId,
				status: PaymentStatusEnum.PAYMENT_DONE,
				subscriptionMonth,
				subscriptionYear
			}
		});
	}

	async getReferenceSubsciptionByStatus(referenceSubscriptionId: number, status: PaymentStatusEnum) {
		let txn = await this.dataSource.getRepository(UserSubscriptionTransactions).findOne({
			where: {
				referenceSubscriptionId,
				status
			}
		});
		return txn;
	}

	async getPackagesByRefDocTypeId(refDocTypeId: number) {
		let packages = await this.dataSource.getRepository(PackageMaster).find({
			where: {
				refdocTypeId: refDocTypeId,
				status: Status.ACTIVE
			}
		});
		if (!packages.length) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return packages;
	}

	async checkUserSubWithNullRefDoc(userId: number, renewalMonth) {
		let userSubscription = await this.dataSource.getRepository(UserSubscriptionTransactions).findOne({
			where: {
				benificiaryUserId: userId,
				refdocId: IsNull(),
				status: PaymentStatusEnum.PAYMENT_DONE,
				renewalMonth: renewalMonth
			}
		});
		if (userSubscription) {
			throw new HttpException({ status: ResponseData.SUBSCRIPTION_ALREADY_EXIST }, HttpStatus.OK);
		}
		return true;
	}

	async updateSubscriptionPaymentStatus(status: PaymentStatusEnum, id: number, referenceId: string, userId: number) {
		let data: UpdateResult = await this.dataSource
			.getRepository(UserSubscriptionTransactions)
			.createQueryBuilder()
			.update()
			.set({ status, referenceId })
			.where(`id=${id}`)
			.andWhere(`userId=${userId}`)
			.andWhere(`status='${PaymentStatusEnum.PURCHASE_INITIATED}'`)
			.execute();
		if (data.affected == 0) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
	}

	async getUserSubByRefDocAndRenewalMonth(userId: number, refdocId: number, renewalMonth) {
		return await this.dataSource.getRepository(UserSubscriptionTransactions).findOne({
			where: {
				benificiaryUserId: userId,
				refdocId,
				status: PaymentStatusEnum.PAYMENT_DONE,
				renewalMonth: renewalMonth
			}
		});
	}

	async getUserFirstSubscriptionForRefdoc(userId: number, refdocId: number) {
		return await this.dataSource.getRepository(UserSubscriptionTransactions).findOne({
			where: {
				benificiaryUserId: userId,
				refdocId,
				status: PaymentStatusEnum.PAYMENT_DONE,
				isFirstSubscription: YesNoEnum.YES
			}
		});
	}

	async getAllPaymentTypes() {
		return await this.dataSource.getRepository(PaymentValidationdocMapping).find({
			where: {
				status: Status.ACTIVE
			}
		});
	}

	async updateUserSubcriptionAutoRenewalQueryRunner(
		userId: number,
		refdocId: number,
		id: number,
		autoRenewal: boolean,
		queryRunner: QueryRunner
	) {
		return await queryRunner.manager
			.getRepository(UserSubscriptionTransactions)
			.createQueryBuilder()
			.update()
			.set({ autoRenewal: autoRenewal })
			.where(`benificiaryUserId=${userId}`)
			.andWhere(`status='${PaymentStatusEnum.PAYMENT_DONE}'`)
			.andWhere(`refdocId='${refdocId}'`)
			.andWhere(`id <> ${id}`)
			.execute();
	}

	async getPaymentTypeDetails(paymentType: string, masterProofType: string) {
		return await this.dataSource.getRepository(PaymentValidationdocMapping).findOne({
			where: {
				status: Status.ACTIVE,
				paymentType,
				masterProofType
			}
		});
	}

	async getUsersLastValidTill(benificiaryUserId: number, packageId: number, refdocId: number, status: PaymentStatusEnum) {
		let userTxn: { id: number; price: number; lastRenewalMonth: Date; paymentType: SubscriptionPaymentTypeEnum } =
			await this.dataSource
				.getRepository(UserSubscriptionTransactions)
				.createQueryBuilder("transaction")
				.select(UsersLastValidTill)
				.where("transaction.refdoc_id = :refdocId", { refdocId })
				.andWhere("transaction.package_id = :packageId", { packageId })
				.andWhere("transaction.benificiary_user_id = :benificiaryUserId", { benificiaryUserId })
				.andWhere("transaction.STATUS = :status", { status })
				.orderBy("transaction.id", "DESC")
				.limit(1)
				.getRawOne();
		return userTxn;
	}

	async getPendingUserSubscriptionData(benificiaryUserId: number, refdocTypeId: number, status: PaymentStatusEnum) {
		let subscriptionData = await this.dataSource.getRepository(UserSubscriptionTransactions).findOne({
			select: {
				id: true,
				packageId: true,
				userId: true,
				benificiaryUserId: true,
				paymentAmount: true,
				paymentType: true,
				status: true
			},
			where: {
				benificiaryUserId,
				status,
				refdocId: IsNull()
			}
		});
		if (!subscriptionData) {
			throw new HttpException({ status: ResponseData.NO_SUBSCRIPTION_AVAILABLE }, HttpStatus.OK);
		}
		return subscriptionData;
	}

	async getUserSubByRefDocId(userId: number, refdocId: number, status: PaymentStatusEnum) {
		let userRefdocSubscription = await this.dataSource.getRepository(UserSubscriptionTransactions).findOne({
			select: {
				packageId: true,
				benificiaryUserId: true,
				price: true,
				paymentAmount: true,
				renewalMonth: true,
				paymentType: true
			},
			where: {
				benificiaryUserId: userId,
				refdocId,
				status
			},
			order: {
				id: "DESC"
			}
		});
		if (!userRefdocSubscription) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return userRefdocSubscription;
	}

	async getPaymentTypeDetailsByMonthlyProofType(monthlyProofType: string) {
		const paymentDetails = await this.dataSource.getRepository(PaymentValidationdocMapping).find({
			where: {
				status: Status.ACTIVE,
				monthlyProofType
			}
		});
		if (!paymentDetails) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return paymentDetails;
	}

	async getSubscriptionTxnData(userId: number, refdocId: number) {
		return await this.dataSource
			.getRepository(UserSubscriptionTransactions)
			.createQueryBuilder("transaction")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = transaction.status")
			.select(GetSubscriptionTransactionData)
			.where("(transaction.userId = :userId OR transaction.benificiaryUserId = :userId)", {
				userId
			})
			.andWhere(`transaction.refdocId = :refdocId`, { refdocId })
			.getRawMany();
	}

	async getRefdocTypeByPackageId(packageId: number) {
		return await this.dataSource
			.getRepository(PackageMaster)
			.createQueryBuilder("package")
			.innerJoin(RefdocTypeMaster, "refdocType", "package.refdocTypeId = refdocType.refdocTypeId")
			.select(GetRefdocTypeByPackageId)
			.where("(package.packageId = :packageId)", { packageId })
			.getRawOne();
	}

	async getPaymentHistoryData(userId: number) {
		const subscriptionDataIds = await this.dataSource
			.getRepository(UserSubscriptionTransactions)
			.createQueryBuilder("transaction")
			.select(["MAX(transaction.id) as maxId"])
			.groupBy("transaction.userId, transaction.refdocId")
			.having("transaction.userId = :userId", { userId })
			.getRawMany();

		const ids = subscriptionDataIds.map((data) => data.maxId);
		if (ids.length) {
			return await this.dataSource
				.getRepository(UserSubscriptionTransactions)
				.createQueryBuilder("transaction")
				.innerJoin(RefdocMaster, "refdoc", "refdoc.refdocId = transaction.refdocId")
				.innerJoin(UserMasterEntity, "users", "users.userId = transaction.userId")
				.innerJoin(PackageMaster, "packages", "packages.packageId = transaction.packageId")
				.leftJoin(StateMasterEntity, "stateMaster", "stateMaster.stateCode = refdoc.state")
				.select(PaymentHistoryData)
				.where("transaction.id IN (:...ids)", { ids })
				.getRawMany();
		} else {
			return [];
		}
	}

	async getUserSubscriptionDataByPaymentId(userId: number, referenceId: string) {
		const paymentDetails = await this.dataSource.getRepository(UserSubscriptionTransactions).findOne({
			where: {
				benificiaryUserId: userId,
				referenceId,
				status: PaymentStatusEnum.PAYMENT_DONE
			}
		});
		if (!paymentDetails) {
			throw new HttpException({ status: ResponseData.INVALID_PAYMENT_ID }, HttpStatus.OK);
		}
		return paymentDetails;
	}

	async getPaymentDoneTxnsByRefId(referenceId: string) {
		return await this.dataSource.getRepository(UserSubscriptionTransactions).findOne({
			where: {
				referenceId,
				status: PaymentStatusEnum.PAYMENT_DONE
			}
		});
	}

	async getPaymentIdByRefdocIdAndBenificiaryUserId(benificiaryUserId: number, refdocId: number) {
		const paymentInfo = await this.dataSource.getRepository(UserSubscriptionTransactions).findOne({
			where: {
				benificiaryUserId,
				refdocId
			}
		});
		if (!paymentInfo) {
			throw new HttpException({ status: ResponseData.INVALID_REFDOC_ID }, HttpStatus.OK);
		}
		return { paymentId: paymentInfo.referenceId };
	}

	async getUserSubscriptionsByRefdocIds(benificiaryUserId: number, refdocIds: number[]) {
		return await this.dataSource.getRepository(UserSubscriptionTransactions).find({
			select: {
				id: true,
				benificiaryUserId: true,
				price: true,
				paymentAmount: true,
				refdocId: true,
				createdAt: true
			},
			where: {
				benificiaryUserId,
				refdocId: In(refdocIds),
				status: PaymentStatusEnum.PAYMENT_DONE
			},
			order: {
				id: "ASC"
			}
		});
	}

	async getPaymentIdByRefdocIdBenificiaryUserIdAndAutoRenewal(
		benificiaryUserId: number,
		refdocId: number,
		autoRenewal: boolean
	) {
		const paymentInfo = await this.dataSource.getRepository(UserSubscriptionTransactions).find({
			where: {
				benificiaryUserId,
				refdocId,
				autoRenewal
			}
		});
		if (!paymentInfo.length) {
			throw new HttpException({ status: ResponseData.NO_ACTIVE_SUBSCRIPTION_FOUND }, HttpStatus.OK);
		}
		return paymentInfo;
	}

	async getAutoRenewalSubscriptionsForDate(endDate, startDate) {
		return await this.dataSource.getRepository(UserSubscriptionTransactions).find({
			where: {
				renewalMonth: Between(startDate, endDate),
				autoRenewal: true,
				status: In([PaymentStatusEnum.PAYMENT_DONE]),
				autodebitRetryCount: LessThan(4)
			}
		});
	}

	async getPaymentInitiatedTxns(time) {
		return await this.dataSource.getRepository(UserSubscriptionTransactions).find({
			where: {
				status: PaymentStatusEnum.PURCHASE_INITIATED,
				updatedAt: LessThan(time)
			}
		});
	}

	async getSubscriptionTxnsByMonthYearAndRefdocId(
		subscriptionMonth: string,
		subscriptionYear: number,
		refdocId: number,
		status: PaymentStatusEnum
	) {
		return await this.dataSource.getRepository(UserSubscriptionTransactions).find({
			where: {
				refdocId,
				status,
				subscriptionMonth,
				subscriptionYear
			}
		});
	}
}
