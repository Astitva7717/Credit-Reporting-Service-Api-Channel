import { RefdocUsersEntity } from "@modules/doc/entities/refdoc-users.entity";
import { StatusMasterEntity } from "@modules/doc/entities/status-master.entity";
import { BackOfficePermissionsDto } from "@modules/user-master/dto/back-office-permission-dto";
import { UserSearchinfoDto } from "@modules/user-master/dto/user-search-info-dto";
import { UserProfileProgress } from "@modules/user-master/entities/user-profile-progress-status.entity";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
	GetUserInfoOfRefdocUsersByRefdocIds,
	GetBackOfficeUserPermissionsInfo,
	GetUserInfoWithStatusDesc,
	GetUserSearchInfo,
	GetUserInfoByRefdocId
} from "@utils/constants/querry-constants";
import { PiiDataPermissions } from "@modules/user-master/entities/pii-data-permissions.entity";
import { UserMasterEntity } from "src/modules/user-master/entities/user-master.entity";
import { Status, UserProfileStatusEnum } from "src/utils/enums/Status";
import { ResponseData } from "src/utils/enums/response";
import { UserType } from "src/utils/enums/user-types";
import { DataSource, In, IsNull, QueryRunner, Repository } from "typeorm";
import { RefdocMaster } from "@modules/doc/entities/refdoc-master.entity";
import { ValidationDocMonthlyProof } from "@modules/monthly-proof/entities/validation-doc-monthly-proof.entity";

@Injectable()
export class UserDaoService {
	constructor(
		@InjectRepository(UserMasterEntity)
		private userMasterRepo: Repository<UserMasterEntity>,
		private readonly datasource: DataSource
	) {}

	async existsByBusinessIdAndChannelIdAndUsernameFromUserInfo(
		businessId: number,
		channelId: number,
		userName: string,
		userType: UserType
	) {
		if (
			(
				await this.userMasterRepo.findBy({
					businessId,
					channelId,
					username: userName,
					userType
				})
			)?.length
		) {
			throw new HttpException({ status: ResponseData["USER_ALREADY_EXIST"] }, HttpStatus.OK);
		}
		return false;
	}

	async existsByBusinessIdAndChannelIdAndMobileCodeAndMobileNoAndUserType(
		businessId: number,
		channelId: number,
		mobileCode: string,
		mobileNumber: string,
		userType: UserType
	) {
		if (
			(
				await this.userMasterRepo.findBy({
					businessId,
					channelId,
					mobileCode,
					mobileNo: mobileNumber,
					userType
				})
			)?.length
		) {
			throw new HttpException({ status: ResponseData["USER_ALREADY_EXIST"] }, HttpStatus.OK);
		}
		return false;
	}

	async existsByBusinessIdAndChannelIdAndEmailIdFromUserInfo(
		businessId: number,
		channelId: number,
		emailId: string,
		userType: UserType
	) {
		if (
			(
				await this.userMasterRepo.findBy({
					businessId,
					channelId,
					emailId,
					userType
				})
			).length
		) {
			throw new HttpException({ status: ResponseData["USER_ALREADY_EXIST"] }, HttpStatus.OK);
		}
		return false;
	}

	async findByBusinessIdAndChannelIdAndSystemUserIdAndUserType(
		businessId: number,
		channelId: number,
		systemUserId: string,
		userType: UserType
	) {
		const userInfo = await this.userMasterRepo.findOneBy({
			businessId,
			channelId,
			systemUserId: systemUserId,
			userType
		});
		if (!userInfo) {
			throw new HttpException({ status: ResponseData.INVALID_USER_FOUND }, HttpStatus.OK);
		}
		return userInfo;
	}

	async existsByBusinessIdAndChannelIdAndSystemUserIdAndUserType(
		businessId: number,
		channelId: number,
		systemUserId: string,
		userType: UserType
	) {
		if (
			(
				await this.userMasterRepo.findBy({
					businessId,
					channelId,
					systemUserId: systemUserId,
					userType
				})
			)?.length
		) {
			throw new HttpException({ status: ResponseData["USERNAME_ALREADY_EXIST"] }, HttpStatus.OK);
		}
		return false;
	}

	async save(userInfo) {
		return await this.userMasterRepo.save(userInfo);
	}

	async saveUserInfoByQueryRunner(userInfo, queryRunner: QueryRunner) {
		return await queryRunner.manager.getRepository(UserMasterEntity).save(userInfo);
	}

	async getUsersByBusinessAndChannel(channelId: number, businessId: number, page: number = 1, limit: number = 20) {
		let offset = (page - 1) * limit;
		return await this.userMasterRepo.find({
			select: {
				userId: true,
				username: true,
				firstName: true
			},
			where: {
				channelId,
				businessId,
				userType: UserType.CONSUMER,
				status: Status.ACTIVE
			},
			skip: offset,
			take: limit
		});
	}

	async getUserInfoByUserId(userId: number) {
		return await this.userMasterRepo.findOneBy({
			userId
		});
	}

	async getUserInfoByRefdocId(refdocId: number) {
		const userData = await this.datasource
			.getRepository(RefdocMaster)
			.createQueryBuilder("refdoc")
			.innerJoin(UserMasterEntity, "user", "user.userId = refdoc.userId")
			.select(GetUserInfoByRefdocId)
			.where(`refdoc.refdocId = :refdocId`, { refdocId })
			.getRawOne();

		if (!userData) {
			throw new HttpException({ status: ResponseData.USER_NOT_FOUND }, HttpStatus.OK);
		}
		return userData;
	}

	async getUserInfoByUserIdAndUserType(userId: number, userType: UserType) {
		const userData = await this.datasource
			.getRepository(UserMasterEntity)
			.createQueryBuilder("user")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = user.status")
			.select(GetUserInfoWithStatusDesc)
			.where(`user.userId = :userId`, { userId })
			.andWhere(`user.userType = :userType`, { userType })
			.getRawOne();

		if (!userData) {
			throw new HttpException({ status: ResponseData.USER_NOT_FOUND }, HttpStatus.OK);
		}
		return userData;
	}

	async getUserInfoByEmailId(emailId: string) {
		return await this.userMasterRepo.findOneBy({
			emailId,
			status: Status.ACTIVE
		});
	}

	async getUserInfoByMobile(mobileCode: string, mobileNo: string) {
		return await this.userMasterRepo.findOneBy({
			mobileNo,
			mobileCode,
			status: Status.ACTIVE
		});
	}

	async getUsersDataByPrimaryIdValues(primaryIdValues: string[]) {
		return await this.datasource
			.getRepository(UserMasterEntity)
			.createQueryBuilder("UserInfo")
			.select(["UserInfo.userId as userId", "UserInfo.primaryIdValue as primaryIdValue"])
			.where(`UserInfo.primaryIdValue  IN (:...primaryIdValues)`, { primaryIdValues })
			.andWhere(`UserInfo.status = '${Status.ACTIVE}'`)
			.getRawMany();
	}

	async existByPrimaryIdValue(primaryIdValue: string) {
		let userData = await this.datasource.getRepository(UserMasterEntity).findOne({
			where: {
				primaryIdValue,
				status: Status.ACTIVE
			}
		});
		if (userData) {
			throw new HttpException({ data: {}, status: ResponseData.DUPLICATE_PRIMARY_ID }, HttpStatus.OK);
		}
	}

	async getUserIdFromSystemUserId(businessId: number, channelId: number, systemUserId: string, userType: UserType) {
		let userData = await this.findByBusinessIdAndChannelIdAndSystemUserIdAndUserType(
			businessId,
			channelId,
			systemUserId,
			userType
		);
		return userData.userId;
	}

	async addUserProfileData(userProfileProgressMasterEntity: UserProfileProgress) {
		return await this.datasource.getRepository(UserProfileProgress).save(userProfileProgressMasterEntity);
	}

	async addUserProfileDataByQueryRunner(userProfileProgressMasterEntity: UserProfileProgress, queryRunner: QueryRunner) {
		return await queryRunner.manager.getRepository(UserProfileProgress).save(userProfileProgressMasterEntity);
	}

	async addMultipleUserProfileData(userProfileProgressMasterEntity: UserProfileProgress[]) {
		return await this.datasource.getRepository(UserProfileProgress).insert(userProfileProgressMasterEntity);
	}

	async getUserProfileData(userId: number) {
		return await this.datasource.getRepository(UserProfileProgress).findOne({
			where: {
				userId,
				refdocId: IsNull()
			}
		});
	}

	async getUserProfileDataForRefdoc(userId: number, refdocId: number) {
		let whereCondition = {
			userId
		};
		whereCondition["refdocId"] = refdocId || IsNull();
		return await this.datasource.getRepository(UserProfileProgress).findOne({
			where: whereCondition
		});
	}

	async getUserProfileDataByUserRefdocIdAndStatus(
		userId: number,
		refdocId: number,
		profileStageCode: UserProfileStatusEnum
	) {
		let whereCondition = {
			userId,
			refdocId: refdocId || IsNull(),
			profileStageCode
		};
		return await this.datasource.getRepository(UserProfileProgress).findOne({
			where: whereCondition
		});
	}

	async updateUserProfileDataForRefdocByQueryRunner(
		id: number,
		profileStageCode: UserProfileStatusEnum,
		data: string,
		refdocId: number,
		queryRunner: QueryRunner
	) {
		let whereCondition = {
			id
		};
		return await queryRunner.manager
			.getRepository(UserProfileProgress)
			.update(whereCondition, { profileStageCode, data, refdocId, updatedAt: new Date() });
	}

	async updateUserProfileData(userId: number, profileStageCode: UserProfileStatusEnum, data: string) {
		return await this.datasource
			.getRepository(UserProfileProgress)
			.update({ userId }, { profileStageCode, data, updatedAt: new Date() });
	}

	async getUserProfileDataByStatusAndRefdoc(userId: number, profileStageCode: UserProfileStatusEnum, refdocId: number) {
		let whereCondition = {
			userId,
			profileStageCode
		};
		whereCondition["refdocId"] = refdocId || IsNull();
		return await this.datasource.getRepository(UserProfileProgress).findOne({
			where: whereCondition
		});
	}

	async getUserInfoFromSystemUserId(systemUserId: string, userType: UserType) {
		const userInfo = await this.userMasterRepo.findOneBy({
			systemUserId,
			userType
		});
		if (!userInfo) {
			throw new HttpException({ status: ResponseData.INVALID_USER_FOUND }, HttpStatus.OK);
		}
		return userInfo;
	}

	async getUserIdFromSystemUserIdAndUserType(systemUserId: string, userType: UserType) {
		const userInfo = await this.userMasterRepo.findOneBy({
			systemUserId,
			userType
		});
		if (!userInfo) {
			throw new HttpException({ status: ResponseData.INVALID_USER_FOUND }, HttpStatus.OK);
		}
		return userInfo.userId;
	}

	async getMultiUserDetails(userIds: number[]) {
		return await this.userMasterRepo.find({
			where: {
				userId: In(userIds)
			}
		});
	}

	async getUserSearchInfo(body: UserSearchinfoDto, userIdsArr, registrationFrom: string, registrationTill: string) {
		let {
			page,
			limit,
			refdocId,
			userId,
			name,
			mobileNo,
			emailId,
			country,
			state,
			city,
			mobileCode,
			status,
			ssn,
			ssnVerified,
			emailVerified,
			mobileVerified,
			refDocParticipant,
			payDocParticipant,
			veriDocParticipant
		} = body;
		const userType = body.userType || UserType.CONSUMER;
		if (!page) {
			page = 1;
		}
		if (!limit) {
			limit = 20;
		}
		let offset = (page - 1) * limit;

		let queryBuilder = this.datasource
			.getRepository(UserMasterEntity)
			.createQueryBuilder("users")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = users.status")
			.select(GetUserSearchInfo)
			.where(`(:userId IS NULL OR users.userId = :userId)`, { userId })
			.andWhere(`(:emailId IS NULL OR users.emailId LIKE :emailId)`, { emailId: `%${emailId || ""}%` })
			.andWhere(`(:mobileNo IS NULL OR users.mobileNo = :mobileNo)`, { mobileNo })
			.andWhere(`(:mobileCode IS NULL OR users.mobileCode = :mobileCode)`, { mobileCode })
			.andWhere(`(:ssn IS NULL OR users.ssn = :ssn)`, { ssn })
			.andWhere(`(:ssnVerified IS NULL OR users.ssnVerified = :ssnVerified)`, { ssnVerified })
			.andWhere(`(:emailVerified IS NULL OR users.emailVerified = :emailVerified)`, { emailVerified })
			.andWhere(`(:mobileVerified IS NULL OR users.mobileVerified = :mobileVerified)`, { mobileVerified })
			.andWhere(`(:refDocParticipant IS NULL OR users.refDocParticipant = :refDocParticipant)`, { refDocParticipant })
			.andWhere(`(:payDocParticipant IS NULL OR users.payDocParticipant = :payDocParticipant)`, { payDocParticipant })
			.andWhere(`(:veriDocParticipant IS NULL OR users.veriDocParticipant = :veriDocParticipant)`, {
				veriDocParticipant
			})
			.andWhere(`(:name IS NULL OR CONCAT(users.firstName, ' ', users.lastName) LIKE :name)`, {
				name: `%${name || ""}%`
			})
			.andWhere(`(:country IS NULL OR users.country = :country)`, {
				country
			})
			.andWhere(`(:state IS NULL OR users.state = :state)`, {
				state
			})
			.andWhere(`(:city IS NULL OR users.city = :city)`, {
				city
			})
			.andWhere(`(:registrationFrom IS NULL OR users.createdAt >= :registrationFrom)`, {
				registrationFrom
			})
			.andWhere(`(:registrationTill IS NULL OR users.createdAt <= :registrationTill)`, {
				registrationTill
			})
			.andWhere(`(:userType IS NULL OR users.userType = :userType)`, {
				userType
			})
			.andWhere(`(:status IS NULL OR users.status = :status)`, {
				status
			});
		if (refdocId) {
			queryBuilder.andWhere(`users.userId IN (:...userIdsArr)`, {
				userIdsArr
			});
		}
		const total = await queryBuilder.getCount();
		const userData = await queryBuilder.offset(offset).limit(limit).getRawMany();
		if (!userData.length) {
			throw new HttpException({ status: ResponseData.USER_NOT_FOUND }, HttpStatus.OK);
		}
		return { userData, total };
	}

	async getBackOfficeUserPermissionsInfo(body: BackOfficePermissionsDto) {
		let { page, limit, username, ssn, email, phone } = body;
		if (!page) {
			page = 1;
		}
		if (!limit) {
			limit = 20;
		}
		let offset = (page - 1) * limit;

		let queryBuilder = this.datasource
			.getRepository(UserMasterEntity)
			.createQueryBuilder("users")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = users.status")
			.innerJoin(PiiDataPermissions, "piiData", "piiData.userId = users.userId")
			.select(GetBackOfficeUserPermissionsInfo)
			.where(`(:name IS NULL OR CONCAT(users.firstName, ' ', users.lastName) LIKE :name)`, {
				name: `%${username || ""}%`
			})
			.andWhere(`(users.userType = :userType)`, { userType: UserType.BO })
			.andWhere(`(:ssn IS NULL OR piiData.ssn = :ssn)`, { ssn })
			.andWhere(`(:email IS NULL OR piiData.email = :email)`, { email })
			.andWhere(`(:phone IS NULL OR piiData.phone = :phone)`, { phone });
		const total = await queryBuilder.getCount();
		const userData = await queryBuilder.offset(offset).limit(limit).getRawMany();
		if (!userData.length) {
			throw new HttpException({ status: ResponseData.USER_NOT_FOUND }, HttpStatus.OK);
		}
		return { userData, total };
	}

	async getUserInfoOfRefdocUsersByRefdocIds(refdocIds: number[]) {
		const refdocUserData = await this.datasource
			.getRepository(RefdocUsersEntity)
			.createQueryBuilder("refdocUsers")
			.innerJoin(UserMasterEntity, "tenantMasterUser", "tenantMasterUser.userId = refdocUsers.tenantId ")
			.leftJoin(UserMasterEntity, "paydocMasterUser", "paydocMasterUser.userId  = refdocUsers.paydocUserId")
			.leftJoin(UserMasterEntity, "veridocMasterUser", "veridocMasterUser.userId  = refdocUsers.veridocUserId")
			.select(GetUserInfoOfRefdocUsersByRefdocIds)
			.where(`refdocUsers.refdocId IN(:...refdocIds)`, { refdocIds })
			.andWhere(`(refdocUsers.status = :status)`, { status: Status.ACTIVE })
			.getRawMany();
		return refdocUserData;
	}

	async getUserInfoOfRefdocUsersByRefdocId(refdocId: number) {
		const refdocUserData = await this.datasource
			.getRepository(RefdocUsersEntity)
			.createQueryBuilder("refdocUsers")
			.innerJoin(UserMasterEntity, "tenantMasterUser", "tenantMasterUser.userId = refdocUsers.tenantId ")
			.leftJoin(UserMasterEntity, "paydocMasterUser", "paydocMasterUser.userId  = refdocUsers.paydocUserId")
			.leftJoin(UserMasterEntity, "veridocMasterUser", "veridocMasterUser.userId  = refdocUsers.veridocUserId")
			.select(GetUserInfoOfRefdocUsersByRefdocIds)
			.where(`refdocUsers.refdocId = :refdocId`, { refdocId })
			.andWhere(`(refdocUsers.status = :status)`, { status: Status.ACTIVE })
			.getRawMany();
		return refdocUserData;
	}

	async getUserPiiPermissionData(userId: number) {
		return await this.datasource.getRepository(PiiDataPermissions).findOne({
			where: {
				userId
			}
		});
	}
	async getPiiDataPermissions(userIds: number[]) {
		return await this.datasource.getRepository(PiiDataPermissions).find({
			where: {
				userId: In(userIds)
			}
		});
	}

	async saveMultiplePiiDataPermissions(multiplePiiDataPermissions: PiiDataPermissions[]) {
		return await this.datasource.getRepository(PiiDataPermissions).save(multiplePiiDataPermissions);
	}

	async savePiiDataPermissions(piiDataPermissions: PiiDataPermissions, queryRunner: QueryRunner) {
		await queryRunner.manager.getRepository(PiiDataPermissions).save(piiDataPermissions);
	}

	async getUserInfoByMonthlyProofId(monthlyProofId: number) {
		return await this.datasource
			.getRepository(ValidationDocMonthlyProof)
			.createQueryBuilder("monthlyProof")
			.innerJoin(UserMasterEntity, "userMaster", "userMaster.userId = monthlyProof.userId")
			.select("userMaster.businessId as businessId")
			.where("monthlyProof.id  =:monthlyProofId", { monthlyProofId })
			.getRawOne();
	}

	async findByBusinessIdAndChannelIdAndSystemUserIdsAndUserType(
		businessId: number,
		channelId: number,
		systemUserIds: number[],
		userType: UserType
	) {
		const userInfoList = await this.userMasterRepo.find({
			where: {
				businessId,
				channelId,
				systemUserId: In(systemUserIds),
				userType
			}
		});

		if (!userInfoList || userInfoList.length === 0) {
			throw new HttpException({ status: ResponseData.INVALID_USER_FOUND }, HttpStatus.OK);
		}

		return userInfoList;
	}
}
