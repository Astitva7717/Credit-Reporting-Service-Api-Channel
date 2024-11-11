import { UserMasterEntity } from "@modules/user-master/entities/user-master.entity";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { GetPlaidData } from "@utils/constants/querry-constants";
import { RefdocMaster } from "src/modules/doc/entities/refdoc-master.entity";
import { RefdocParticipantsMaster } from "src/modules/doc/entities/refdoc-participants-master.entity";
import {
	MasterProofTypeEnum,
	ProofStatus,
	ValidationDocMasterProof
} from "src/modules/doc/entities/validation-doc-master-proof.entity";
import { PlaidLinkTokens } from "src/modules/plaid/entities/plaid-link-tokens.entity";
import { Status } from "src/utils/enums/Status";
import { ResponseData } from "src/utils/enums/response";
import { DataSource, QueryRunner } from "typeorm";

@Injectable()
export class PlaidAuthDaoService {
	constructor(private dataSource: DataSource) {}
	async saveLinkToken(userId: number, linkToken: string, refdocId: number, paymentType: string) {
		let plaidLinkTokenDto: PlaidLinkTokens = new PlaidLinkTokens(userId, linkToken, null, refdocId, paymentType);
		await this.dataSource.getRepository(PlaidLinkTokens).save(plaidLinkTokenDto);
	}

	async updateAccessToken(
		userId: number,
		accessToken: string,
		itemId: string,
		refdocId: number,
		paymentType: string,
		linkToken: string
	) {
		await this.dataSource
			.getRepository(PlaidLinkTokens)
			.update({ userId, refdocId, paymentType, linkToken }, { accessToken, updatedAt: new Date() });
	}

	async getUserTokenDetails(userId: number, refdocId: number, paymentType: string) {
		let userLinkToken = await this.dataSource.getRepository(PlaidLinkTokens).findOne({
			where: {
				userId,
				refdocId,
				paymentType
			}
		});
		return userLinkToken;
	}

	async updateUserLinkToken(userId: number, linkToken: string, refdocId: number, paymentType: string) {
		await this.dataSource
			.getRepository(PlaidLinkTokens)
			.createQueryBuilder()
			.update()
			.set({ linkToken, updatedAt: new Date() })
			.where(`userId=${userId}`)
			.andWhere(`refdocId=${refdocId}`)
			.andWhere(`paymentType='${paymentType}'`)
			.execute();
	}

	/**
	 *
	 * @param userId
	 * @param refdocTypeId
	 * @returns
	 * @author Ankit Singh
	 */
	async getUserAccessToken(userId: number, refdocId: number, paymentType: string) {
		let userLinkToken = await this.dataSource.getRepository(PlaidLinkTokens).findOne({
			where: {
				userId,
				paymentType,
				refdocId
			}
		});
		return userLinkToken;
	}

	async insertValidationDocMasterDataByQueryRunner(validationDocMasterData: ValidationDocMasterProof[], queryRunner: QueryRunner) {
		await queryRunner.manager.getRepository(ValidationDocMasterProof).save(validationDocMasterData);
	}

	async getUserProofIdValue(userId: number, masterProofType: MasterProofTypeEnum) {
		let validationDocMasterData = await this.dataSource.getRepository(ValidationDocMasterProof).find({
			where: {
				userId,
				masterProofType
			}
		});
		return validationDocMasterData;
	}

	async getUserRefDocData(userId: number, refdocTypeId: number) {
		let refDocData = await this.dataSource.getRepository(RefdocMaster).findOne({
			where: {
				userId,
				refdocTypeId
			}
		});
		return refDocData;
	}

	/**
	 *
	 * @param userId
	 * @param accountIds - accountIds to update
	 * @param status - new status
	 * @author - Ankit Singh
	 */
	async updateValidationDocProofStatus(userId: number, accountIds: string[], status: ProofStatus) {
		await this.dataSource
			.getRepository(ValidationDocMasterProof)
			.createQueryBuilder()
			.update()
			.set({ status })
			.where(`userId=${userId}`)
			.andWhere(`proofIdValue IN (:...accountIds)`, { accountIds })
			.execute();
	}

	/**
	 *
	 * @param userId
	 * @param paymentType
	 * @returns userAccountData
	 * @author - Ankit Singh
	 */
	async getPlaidUserData(userId: number, paymentType: string) {
		let userAccountData = await this.dataSource.getRepository(ValidationDocMasterProof).find({
			where: {
				userId,
				paymentType,
				status: ProofStatus.APPROVED
			}
		});
		if (!userAccountData.length) {
			throw new HttpException({ data: {}, status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return userAccountData;
	}

	/**
	 *
	 * @param userId
	 * @param refdocId
	 * @returns
	 * @author Ankit Singh
	 */
	async getRefDocParticipantData(userId: number, refdocId: number) {
		let refDocParticipantData = await this.dataSource
			.getRepository(RefdocMaster)
			.createQueryBuilder("RefdocMaster")
			.innerJoin(
				RefdocParticipantsMaster,
				"RefdocParticipantsMaster",
				"RefdocMaster.id = RefdocParticipantsMaster.refdocId"
			)
			.select(["RefdocMaster.id as refdocId"])
			.where(`RefdocMaster.status='${ProofStatus.APPROVED}'`)
			.andWhere(`RefdocMaster.id=${refdocId}`)
			.andWhere(`RefdocParticipantsMaster.userId = ${userId}`)
			.andWhere(`RefdocParticipantsMaster.status = '${Status.ACTIVE}'`)
			.getRawOne();
		return refDocParticipantData;
	}

	async getUserLinkTokenDetails(userId: number, refdocId: number, paymentType: string, linkToken: string) {
		let userLinkToken = await this.dataSource.getRepository(PlaidLinkTokens).findOne({
			where: {
				userId,
				refdocId,
				paymentType,
				linkToken
			}
		});
		return userLinkToken;
	}

	async getUserLinkTokenDetailsByTokenId(userId: number, refdocId: number, paymentType: string, plaidTokenId: number) {
		let userLinkToken = await this.dataSource.getRepository(PlaidLinkTokens).findOne({
			where: {
				userId,
				refdocId,
				id: plaidTokenId,
				paymentType
			}
		});
		if (!userLinkToken) {
			throw new HttpException({ status: ResponseData.NO_PLAID_TOKEN_FOUND }, HttpStatus.OK);
		}
		return userLinkToken;
	}

	async getPlaidData(userId: number) {
		const data = await this.dataSource
			.getRepository(ValidationDocMasterProof)
			.createQueryBuilder("MasterProof")
			.innerJoin(RefdocMaster, "RefdocMaster", "MasterProof.refdocId = RefdocMaster.refdocId")
			.innerJoin(UserMasterEntity, "user", "user.userId = RefdocMaster.userId")
			.select(GetPlaidData)
			.where(`MasterProof.payeeId = ${userId}`)
			.andWhere(`MasterProof.status ='${ProofStatus.APPROVED}'`)
			.andWhere(`MasterProof.masterProofType = '${MasterProofTypeEnum.PLAID}'`)
			.getRawMany();

		return data;
	}
}
