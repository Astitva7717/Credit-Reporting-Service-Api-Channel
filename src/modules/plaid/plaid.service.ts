import { DocDaoService } from "@modules/dao/doc-dao/doc-dao.service";
import { PackageDaoService } from "@modules/dao/package-dao/package-dao.service";
import { ParticipantDaoService } from "@modules/dao/participant-dao/participant-dao.service";
import { PlaidAuthDaoService } from "@modules/dao/plaid-auth-dao/plaid-auth-dao.service";
import { UserDaoService } from "@modules/dao/user-dao/user-dao.service";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CommonUtilityService } from "@utils/common/common-utility/common-utility.service";
import { ConfigurationService } from "@utils/configuration/configuration.service";
import { ResponseData } from "@utils/enums/response";
import {
	AuthGetRequest,
	Configuration,
	CountryCode,
	LinkTokenCreateRequest,
	PlaidApi,
	PlaidEnvironments,
	Products,
	TransactionsGetRequest
} from "plaid";
import { GenerateLinkTokenDto } from "./dto/generate-link-token.dto";
import { AppTypeEnum, PayeeTypeEnum, RentPaymentByEnum, Status } from "@utils/enums/Status";
import { RefdocParticipantsMaster } from "@modules/doc/entities/refdoc-participants-master.entity";
import { UserType } from "@utils/enums/user-types";
import {
	MasterProofTypeEnum,
	ProofStatus,
	ValidationDocMasterProof
} from "@modules/doc/entities/validation-doc-master-proof.entity";
import { PaymentTypePlaidSubTypesMapping } from "@utils/enums/txn-types";
import { GenerateAccessTokenDto } from "./dto/generate-token.dto";
import { QueryRunner } from "typeorm";
import { GetAccountDetailsDto } from "./dto/get-acc-details.dto";
import { AccountTypeConstant } from "@utils/constants/plaid-constants";
import { ConfigCodeEnum } from "@utils/enums/constants";
import { ConfigService } from "src/config";
import { ExternalApiCallService } from "@utils/common/external-api-call/external-api-call.service";
import { ExternalUrlsService } from "@utils/constants/urls";

@Injectable()
export class PlaidService {
	configuration: Configuration;
	plaidClient: PlaidApi;
	constructor(
		private readonly plaidAuthDaoService: PlaidAuthDaoService,
		private readonly externalApiCallService: ExternalApiCallService,
		private readonly externalUrlsService: ExternalUrlsService,
		private configurationService: ConfigurationService,
		private readonly docDaoService: DocDaoService,
		private readonly userDaoService: UserDaoService,
		private readonly participantDaoService: ParticipantDaoService,
		private readonly packageDaoService: PackageDaoService,
		private readonly configService: ConfigService,
		private readonly commonUtilityService: CommonUtilityService
	) {
		this.configuration = new Configuration({
			basePath: PlaidEnvironments.sandbox,
			baseOptions: {
				headers: {
					"PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
					"PLAID-SECRET": process.env.PLAID_SECRET
				}
			}
		});

		this.plaidClient = new PlaidApi(this.configuration);
	}

	validateGenerateLinkTokenRequest(body: GenerateLinkTokenDto) {
		let { refdocId, benificiaryUserId, payeeType, paymentType } = body;
		if (
			!refdocId ||
			!Number.isInteger(+refdocId) ||
			!Object.keys(PayeeTypeEnum).includes(payeeType) ||
			(payeeType === PayeeTypeEnum.OTHER && !benificiaryUserId) ||
			!paymentType
		) {
			throw new HttpException({ status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
		}
	}

	async validateTokenCreationForRefdoc(body: GenerateLinkTokenDto, request: any) {
		let { refdocId, benificiaryUserId, payeeType } = body;
		let { businessId, channelId, userid } = request.headers;
		if (payeeType === PayeeTypeEnum.OTHER) {
			benificiaryUserId = await this.userDaoService.getUserIdFromSystemUserId(
				businessId,
				channelId,
				benificiaryUserId.toString(),
				UserType.CONSUMER
			);
			if (!benificiaryUserId) {
				throw new HttpException({ status: ResponseData.INVALID_USER_ID }, HttpStatus.OK);
			}
			let refdocParticipantData: RefdocParticipantsMaster = await this.docDaoService.getRefdocParticipantDataByUser(
				refdocId,
				benificiaryUserId,
				Status.ACTIVE
			);
			if (refdocParticipantData.paymentBy === RentPaymentByEnum.SELF) {
				throw new HttpException({ status: ResponseData.INVALID_REFDOC_ID }, HttpStatus.OK);
			}
			await this.participantDaoService.getInvitedUserPaymentRequestDataByPayeeUser(
				benificiaryUserId,
				refdocId,
				userid
			);
		} else {
			let refdocParticipantData: RefdocParticipantsMaster = await this.docDaoService.getRefdocParticipantDataByUser(
				refdocId,
				userid,
				Status.ACTIVE
			);
		}

	}

	async getLinkToken(body: GenerateLinkTokenDto, request: any) {
		let { refdocId, paymentType, appType } = body;
		this.validateGenerateLinkTokenRequest(body);
		let masterProofType = MasterProofTypeEnum.PLAID;
		if (!(await this.packageDaoService.getPaymentTypeDetails(paymentType, masterProofType))) {
			throw new HttpException({ status: ResponseData.INVALID_PAYMENT_TYPE }, HttpStatus.OK);
		}
		let userId = request.headers.userid;
		await this.validateTokenCreationForRefdoc(body, request);
		const tokenRequest: LinkTokenCreateRequest = {
			user: {
				client_user_id: `${userId}`
			},
			client_name: "Plaid Test App",
			products: [Products.Auth, Products.Transactions],
			country_codes: [CountryCode.Us],
			language: "en",
			webhook: "https://sample-web-hook.com",
			account_filters: {
				depository: {
					account_subtypes: [PaymentTypePlaidSubTypesMapping[paymentType]]
				}
			}
		};
		if (appType === AppTypeEnum.MOBILE) {
			tokenRequest["android_package_name"] = this.configService.get("CRYR_ANDROID_PACKAGE_NAME").toString();
		} else if (appType === AppTypeEnum.WEB) {
			tokenRequest["redirect_uri"] = "https://cryr-app.sapidblue.in/";
		}
		try {
			const response = await this.plaidClient.linkTokenCreate(tokenRequest);
			const linkToken = response?.data?.link_token;
			await this.plaidAuthDaoService.saveLinkToken(userId, linkToken, refdocId, paymentType);
			return { linkToken };
		} catch (error) {
			throw new HttpException({ data: {}, status: ResponseData.UNKNOWN_EXCEPTION }, HttpStatus.OK);
		}
	}

	async getAccessToken(body: GenerateAccessTokenDto, request: any) {
		let { publicToken, refdocId, paymentType, linkToken } = body;
		if (!publicToken || !refdocId || !paymentType || !linkToken) {
			throw new HttpException({ data: {}, status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.OK);
		}
		let userId = request.headers.userid;
		try {
			let userLinkToken = await this.plaidAuthDaoService.getUserLinkTokenDetails(
				userId,
				refdocId,
				paymentType,
				linkToken
			);
			if (!userLinkToken) {
				throw new HttpException({ data: {}, status: ResponseData.NO_PLAID_TOKEN_FOUND }, HttpStatus.OK);
			}
			const response = await this.plaidClient.itemPublicTokenExchange({
				public_token: publicToken
			});
			const accessToken = response?.data?.access_token;
			const itemId = response?.data?.item_id;
			await this.plaidAuthDaoService.updateAccessToken(userId, accessToken, itemId, refdocId, paymentType, linkToken);
			return { plaidTokenId: userLinkToken.id };
		} catch (e) {
			if (e?.response?.status) {
				throw new HttpException(
					{
						data: {},
						status: {
							errorCode: e?.response?.status?.errorCode || ResponseData.UNKNOWN_EXCEPTION.errorCode,
							errorMessage: e?.response?.status?.errorMessage || ResponseData.UNKNOWN_EXCEPTION.errorMessage
						}
					},
					HttpStatus.OK
				);
			}
			throw new HttpException({ data: {}, status: ResponseData.UNKNOWN_EXCEPTION }, HttpStatus.OK);
		}
	}

	async insertValidationProofPlaidAccountIds(
		accountIds: string[],
		userId: number,
		accountIdDataJson: Object,
		verifiedBy: number,
		refdocAndPayeeIdObj,
		plaidObj,
		queryRunner: QueryRunner
	) {
		let docMasterProofDataArray = new Array(accountIds.length);
		const { refdocId, payeeId } = refdocAndPayeeIdObj;
		accountIds.forEach((accountId) => {
			let validationDocMasterProofData = new ValidationDocMasterProof(
				userId,
				payeeId,
				refdocId,
				MasterProofTypeEnum.PLAID,
				plaidObj["paymentType"],
				ProofStatus.APPROVED
			);
			validationDocMasterProofData.updateProofDetails(
				accountId,
				plaidObj["proofPath"],
				JSON.stringify(accountIdDataJson[accountId])
			);
			validationDocMasterProofData.updateVerifingDetails(verifiedBy);
			validationDocMasterProofData.updatePlaidTokenId(plaidObj["plaidTokenId"]);
			docMasterProofDataArray.push(validationDocMasterProofData);
		});
		await this.plaidAuthDaoService.insertValidationDocMasterDataByQueryRunner(docMasterProofDataArray, queryRunner);
	}

	async getAccDetails(query: GetAccountDetailsDto, request: any) {
		let userId = request.headers.userid;
		let { paymentType, refdocId } = query;
		let tokenDetails = await this.plaidAuthDaoService.getUserTokenDetails(userId, refdocId, paymentType);
		if (!tokenDetails?.accessToken) {
			throw new HttpException({ data: {}, status: ResponseData.NO_PLAID_TOKEN_FOUND }, HttpStatus.OK);
		}
		try {
			const { accountData, numbers } = await this.fetchAccountDetails(tokenDetails.accessToken);
			return { accountData, numbers };
		} catch (error) {
			throw new HttpException({ data: {}, status: ResponseData.UNKNOWN_EXCEPTION }, HttpStatus.OK);
		}
	}

	async fetchAccountDetails(accessToken: string) {
		const accRequest: AuthGetRequest = {
			access_token: accessToken
		};
		try {
			const response = await this.plaidClient.authGet(accRequest);
			const accountData = response.data.accounts;
			const numbers = response.data.numbers;
			return { accountData, numbers };
		} catch (error) {
			throw new HttpException({ data: {}, status: ResponseData.PLAID_ERROR }, HttpStatus.OK);
		}
	}

	async getUserPlaidAccounts(paymentType: string, request: any) {
		let allowedPaymentTypes = Object.values(AccountTypeConstant);
		if (!allowedPaymentTypes.includes(paymentType)) {
			throw new HttpException({ data: {}, status: ResponseData.INVALID_PAYMENT_TYPE }, HttpStatus.OK);
		}
		const { channelId, userid } = request.headers;
		let accountsData = await this.plaidAuthDaoService.getPlaidUserData(userid, paymentType);
		const configs = await this.configurationService.getChannelConfigurations(channelId);
		const dateFormat = configs.get(ConfigCodeEnum.DEFAULT_DATE_FORMAT) || "MM-DD-YYYY";
		accountsData.forEach((account) => {
			account["proofDetail"] = JSON.parse(account["proofDetail"]);
			account["verifiedAt"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				account["verifiedAt"].toString(),
				dateFormat
			);
			account["validTill"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				account["validTill"].toString(),
				dateFormat
			);
		});
		return accountsData;
	}

	async getPlaidAccountDetailsFromAccessToken(accessToken: string) {
		let accountIdDataJson = {};
		const { accountData, numbers } = await this.fetchAccountDetails(accessToken);

		accountData.forEach((acc) => {
			let { account_id, ...data } = acc;
			accountIdDataJson[account_id] = data;
			accountIdDataJson[account_id]["paymentType"] = AccountTypeConstant[data.type];
		});
		numbers.ach.forEach((acc) => {
			let { account_id, ...rest } = acc;
			accountIdDataJson[account_id] = { ...accountIdDataJson[account_id], ...rest };
		});
		numbers.bacs.forEach((acc) => {
			let { account_id, ...rest } = acc;
			accountIdDataJson[account_id] = { ...accountIdDataJson[account_id], ...rest };
		});
		numbers.eft.forEach((acc) => {
			let { account_id, ...rest } = acc;
			accountIdDataJson[account_id] = { ...accountIdDataJson[account_id], ...rest };
		});
		numbers.international.forEach((acc) => {
			let { account_id, ...rest } = acc;
			accountIdDataJson[account_id] = { ...accountIdDataJson[account_id], ...rest };
		});

		return accountIdDataJson;
	}

	async getPlaidAccountInfo(request: any) {
		const { userid, channelId } = request.headers;
		const plaidData = await this.plaidAuthDaoService.getPlaidData(userid);
		let refdocPlaidData = {};
		const configs = await this.configurationService.getChannelConfigurations(channelId);
		const dateFormat = configs.get(ConfigCodeEnum.DEFAULT_DATE_FORMAT) || "MM-DD-YYYY";
		const stateCodeToNameMapping = await this.commonUtilityService.getStateCodeToNameMapping();
		plaidData.forEach((plaid) => {
			plaid["state"] = stateCodeToNameMapping[plaid["state"]];
			plaid.proofDetail = JSON.parse(plaid.proofDetail);
			plaid.proofDetail["masterProofId"] = plaid.masterProofId;
			delete plaid.masterProofId;
			plaid["validFrom"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				plaid["validFrom"],
				dateFormat
			);
			plaid["validTo"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				plaid["validTo"],
				dateFormat
			);
			if (!Object.keys(refdocPlaidData).includes(plaid.refdocId)) {
				refdocPlaidData[plaid.refdocId] = plaid;
				refdocPlaidData[plaid.refdocId]["proofDetail"] = [plaid.proofDetail];
			} else {
				refdocPlaidData[plaid.refdocId]["proofDetail"].push(plaid.proofDetail);
			}
		});
		return Object.values(refdocPlaidData);
	}

	async getUserPlaidTxns(txnRequest: TransactionsGetRequest, accessToken: string) {
		const txnResponse = await this.plaidClient.transactionsGet(txnRequest);
		let transactions = txnResponse.data.transactions;
		const total_transactions = txnResponse.data.total_transactions;
		// Manipulate the offset parameter to paginate
		// transactions and retrieve all available data
		while (transactions.length < total_transactions) {
			const paginatedRequest: TransactionsGetRequest = {
				access_token: accessToken,
				start_date: txnRequest.start_date,
				end_date: txnRequest.end_date,
				options: {
					offset: transactions.length,
					include_personal_finance_category: true
				}
			};
			const paginatedResponse = await this.plaidClient.transactionsGet(paginatedRequest);
			transactions = transactions.concat(paginatedResponse.data.transactions);
		}
		return transactions;
	}

	async getUserPlaidAccountTransactions(accessToken: string, fromDate: string, toDate: string, proofIdValue: string) {
		const txnRequest: TransactionsGetRequest = {
			access_token: accessToken,
			start_date: fromDate,
			end_date: toDate,
			options: {
				include_personal_finance_category: true,
				account_ids: [proofIdValue]
			}
		};
		let transactions;
		try {
			transactions = await this.getUserPlaidTxns(txnRequest, accessToken);
		} catch (err) {
			// handle error
			throw err;
		}
		return transactions;
	}

	async getPlaidTxnCategories() {
		try {
			const url = this.externalUrlsService.plaidCategoryUrl;
			const headers = {
				"Content-Type": "application/json"
			};
			const categoryData = await this.externalApiCallService.postReq(headers, {}, url);

			if (categoryData?.errorCode) {
				throw new HttpException(categoryData, HttpStatus.OK);
			}
			return categoryData;
		} catch (e) {
			throw new HttpException(e?.response, HttpStatus.OK);
		}
	}
}
