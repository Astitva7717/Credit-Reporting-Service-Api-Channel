import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ResponseData } from "src/utils/enums/response";
const FormData = require("form-data");
import VariablesConstant from "@utils/variables-constant";
import { ConfigurationService } from "@utils/configuration/configuration.service";
import { ExternalApiCallService } from "../external-api-call/external-api-call.service";
import { UserDaoService } from "@modules/dao/user-dao/user-dao.service";
import {
	MonthlyProofStatusEnum,
	ReceiptStatusEnum,
	UserProfileStatusEnum,
	YNStatusEnum,
	YesNoEnum
} from "@utils/enums/Status";
import * as moment from "moment";
import { AppLoggerService } from "src/app-logger/app-logger.service";
import { MasterDataDaoService } from "@modules/dao/master-data-dao/master-data-dao.service";
import { AppLoggerDto } from "@app-logger/app-logger.dto";
import { MonthMapEnum, MonthNameToNumberEnum } from "@utils/constants/map-month-constants";
import { UserProfileProgress } from "@modules/user-master/entities/user-profile-progress-status.entity";
import { QueryRunner } from "typeorm";
import { ConfigService } from "src/config";
import { BuisnessTypeEnum } from "@modules/doc/entities/refdoc-master.entity";
import { BuisnessTypeCodeEnum, DocumentPresentCodeEnum, RefDocTypeCodeEnum } from "@utils/enums/refdoc-enums";
import { ConfigCodeEnum } from "@utils/enums/constants";
import { CommonDaoService } from "@modules/dao/common-dao/common-dao.service";
import { MonthlyDocDaoService } from "@modules/dao/monthly-doc-dao/monthly-doc-dao.service";
const crypto = require("crypto");

@Injectable()
export class CommonUtilityService {
	constructor(
		private readonly configurationService: ConfigurationService,
		private readonly externalApiCallService: ExternalApiCallService,
		private readonly userDaoService: UserDaoService,
		private readonly appLoggerService: AppLoggerService,
		private readonly configService: ConfigService,
		private readonly masterDataDaoService: MasterDataDaoService,
		private readonly commonDaoService: CommonDaoService,
		private readonly monthlyDocDaoService: MonthlyDocDaoService
	) {}
	static isMobileValid(mobileRegex, mobileNo) {
		if (!mobileRegex) {
			throw new HttpException({ status: ResponseData.INVALID_MOBILE_REGEX }, HttpStatus.OK);
		}
		if (!new RegExp(mobileRegex)?.test(mobileNo)) {
			throw new HttpException({ status: ResponseData.INVALID_MOBILE_NO }, HttpStatus.OK);
		}
	}

	static isEmailValid(emailRegex, emailId) {
		if (!emailRegex) {
			throw new HttpException({ status: ResponseData.INVALID_EMAIL_REGEX }, HttpStatus.OK);
		}
		if (!new RegExp(emailRegex)?.test(emailId)) {
			throw new HttpException({ status: ResponseData.INVALID_EMAIL }, HttpStatus.OK);
		}
	}

	static isZipcodeValid(zipCodeRegex, zipCode) {
		if (!zipCodeRegex) {
			throw new HttpException({ status: ResponseData.INVALID_ZIP_REGEX }, HttpStatus.OK);
		}
		if (!new RegExp(zipCodeRegex)?.test(zipCode)) {
			throw new HttpException({ status: ResponseData.INVALID_ZIP_CODE }, HttpStatus.OK);
		}
	}

	static getModifiedDate(date: Date) {
		return (
			date.getFullYear() +
			"-" +
			(date.getMonth() + 1) +
			"-" +
			+date.getDate() +
			" " +
			date.getHours() +
			":" +
			date.getMinutes() +
			":" +
			date.getSeconds()
		);
	}

	async uploadImageToS3(file, businessId: number) {
		let fileExtension = file.mimetype.split("/")[1];
		const file_name = ((new Date().getTime() / 1000) | 0) + "-" + file?.fieldname + "." + fileExtension;
		const formData = new FormData();
		formData.append("filePath", "cryr/masterProof/");
		formData.append("fileName", file_name);
		formData.append("file", file.buffer, {
			filename: file_name
		});

		let uploadResponse = null;
		let config = await this.configurationService.getBusinessConfigurations(businessId);
		let uploadUrl = config.get("CONSUMER_DOCUMENT_UPLOAD_URL");
		try {
			uploadResponse = await this.externalApiCallService.postReq(formData.getHeaders, formData, uploadUrl);
		} catch (e) {
			throw new HttpException({ status: ResponseData.ERROR_IN_IMAGE_UPLOAD }, HttpStatus.OK);
		}
		if (uploadResponse?.errorCode === 0) {
			return { url: uploadResponse?.url };
		}
		const appLoggerDto: AppLoggerDto = new AppLoggerDto(
			VariablesConstant.ERROR,
			"error_in_upload_file_to_s3_request",
			"uploadFile",
			"CommonUtilityService",
			"uploadImageToS3",
			uploadResponse
		);
		appLoggerDto.addData(uploadUrl);
		this.appLoggerService.writeLog(appLoggerDto);
		throw new HttpException({ status: ResponseData.ERROR_IN_FILE_UPLOAD }, HttpStatus.OK);
	}

	async checkLoginStatus(userId, userToken, aliasName, actionType) {
		const configMap = await this.configurationService.getBusinessConfigurations(0);

		const systemUrls = configMap.get(VariablesConstant.INTER_SYSTEM_URLS);
		let url;
		try {
			const configValues = JSON.parse(systemUrls);

			if (configValues["checkLoginStatus"][VariablesConstant.URL_DETAILS]) {
				url = configValues["checkLoginStatus"][VariablesConstant.URL_DETAILS]["url"];
			}
		} catch (e) {
			throw new HttpException({ data: {}, status: ResponseData.URL_NOT_FOUND_ERROR_CODE }, HttpStatus.OK);
		}

		const headers = {
			"Content-Type": "application/json",
			[VariablesConstant.USER_ID]: userId,
			userToken,
			aliasName
		};

		let queryParam;
		if (actionType) {
			queryParam["actionType"] = actionType;
		}
		const result = await this.externalApiCallService.getReq(url, queryParam, headers);

		if (result?.errorCode !== 0) {
			throw new HttpException(
				{
					data: {},
					errorCode: result?.errorCode,
					errorMessage: result?.errorMessage
				},
				HttpStatus.OK
			);
		}
		return result;
	}

	getPackageRenewalDate(nextRenewalMonth: number) {
		let currDate = new Date();
		let renewalDate = new Date(currDate.getFullYear(), currDate.getMonth() + nextRenewalMonth, 1);
		return `${renewalDate.getFullYear()}-${renewalDate.getMonth() + 1}-1`;
	}

	generateRandomCode(length) {
		const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		const charsetLength = charset.length;
		let code = "";

		for (let i = 0; i < length; i++) {
			const randomIndex = Math.floor(Math.random() * charsetLength);
			code += charset.charAt(randomIndex);
		}

		return code;
	}

	getNumberOfMonthsBetweenDates(startDate, endDate) {
		const startYear = startDate.getFullYear();
		const startMonth = startDate.getMonth();
		const endYear = endDate.getFullYear();
		const endMonth = endDate.getMonth();

		return (endYear - startYear) * 12 + (endMonth - startMonth);
	}

	async updateUserProfileStatus(
		userId: number,
		currentProfileSatus: UserProfileStatusEnum,
		newProfileStatus: UserProfileStatusEnum,
		data: string,
		refdocId: number | null,
		queryRunner: QueryRunner,
		userProfileStatusValue?: UserProfileProgress
	) {
		let userProfileStatus;
		if (userProfileStatusValue) {
			userProfileStatus = userProfileStatusValue;
		} else {
			userProfileStatus = await this.userDaoService.getUserProfileDataForRefdoc(userId, refdocId);
		}
		if (userProfileStatus?.profileStageCode === UserProfileStatusEnum[currentProfileSatus]) {
			await this.userDaoService.updateUserProfileDataForRefdocByQueryRunner(
				userProfileStatus.id,
				UserProfileStatusEnum[newProfileStatus],
				data,
				refdocId,
				queryRunner
			);
		}
	}

	getFirstDateOfMonthFromMonthYear(month: string, year: number) {
		const monthNumber = MonthNameToNumberEnum[month];
		return `${year}-${monthNumber?.toString()?.padStart(2, "0")}-01`;
	}

	getFirstDateOfMonth(currDate: Date) {
		return `${currDate.getFullYear()}-${String(currDate.getMonth() + 1).padStart(2, "0")}-01`;
	}

	getReportingDurationDate(month: number, year: number) {
		return this.modifiedDateTime(new Date(year, month - 1, 1));
	}

	modifiedDateTime(date: Date) {
		return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + +date.getDate();
	}

	modifiedDateTimeForPlaid(date: Date) {
		return (
			date.getFullYear() +
			"-" +
			(date.getMonth() + 1).toString().padStart(2, "0") +
			"-" +
			date.getDate().toString().padStart(2, "0")
		);
	}

	getDateOfDaysFromToday(days: number) {
		const today = new Date();
		const newDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + days);
		return this.modifiedDateTime(newDate);
	}

	getDaysFromDateToToday(date: string) {
		const newDate = new Date(date);
		const currentDate = new Date();
		const differenceInMilliseconds = currentDate.getTime() - newDate.getTime();
		const millisecondsInOneDay = 1000 * 60 * 60 * 24;
		let daysPassed = Math.floor(differenceInMilliseconds / millisecondsInOneDay);
		if (daysPassed < 1) {
			daysPassed = "<1 Day" as any;
		} else if (daysPassed === 1) {
			daysPassed = (daysPassed.toString() + " Day") as any;
		} else {
			daysPassed = (daysPassed.toString() + " Days") as any;
		}
		return daysPassed;
	}

	convertDateFormatIntoDefaultDateFormat(date: any, dateFormat: string) {
		dateFormat = dateFormat.replace(/d/g, "D");
		return date ? moment(date).format(dateFormat) : null;
	}

	convertDateInToTimestamp(date: any) {
		date = new Date(date);
		const timestamp = date?.getTime();
		return timestamp;
	}

	getDateWithMonthName(date: Date) {
		const month = date.getMonth() + 1;
		const monthName = MonthMapEnum[month.toString()];
		const newDate = `${date.getDate()}` + " " + `${monthName} `;
		return newDate;
	}

	getMonthAndYearFromDate(date: Date) {
		const month = date.getMonth() + 1;
		const year = date.getFullYear();
		return { month, year };
	}

	async getStateCodeToNameMapping() {
		const stateList = await this.masterDataDaoService.findByCountryCodeAndStatus(null);
		const stateCodeToNameMapping = stateList.reduce((accumulator, state) => {
			accumulator[state.stateCode] = state.name;
			return accumulator;
		}, {});
		return stateCodeToNameMapping;
	}

	async getCityCodeToNameMapping() {
		const cityList = await this.masterDataDaoService.findByStateCodeAndStatus(null);
		const cityCodeToNameMapping = cityList.reduce((accumulator, city) => {
			accumulator[city.cityCode] = city.cityName;
			return accumulator;
		}, {});
		return cityCodeToNameMapping;
	}

	getLastDateOfMonth(date: Date) {
		return this.modifiedDateTime(new Date(date.getFullYear(), date.getMonth() + 1, 0));
	}

	getFirstAndLastDate(reportingMonth: string, reportingYear: number) {
		let monthNumber;
		Object.keys(MonthMapEnum).forEach((key) => {
			if (MonthMapEnum[key] === reportingMonth) {
				monthNumber = parseInt(key);
			}
		});
		const firstDate = new Date(reportingYear, monthNumber - 1, 1);
		const lastDate = new Date(reportingYear, monthNumber, 0);

		return { firstDate, lastDate };
	}

	getPreviousConsecutiveDate(date: Date, dayGap: number) {
		const nextDate = new Date(date);
		nextDate.setDate(date.getDate() - dayGap);
		return nextDate;
	}

	formatMobileNumber(mobileNumber: string, havePhonePermission: YNStatusEnum = YNStatusEnum.NO) {
		if (!mobileNumber) {
			return null;
		}
		const formattedMobile = CommonUtilityService.replaceString(mobileNumber, 0, mobileNumber.length - 4, "X");
		return havePhonePermission === YNStatusEnum.YES
			? mobileNumber.substring(0, 3) + "-" + mobileNumber.substring(3, 6) + "-" + mobileNumber.substring(6)
			: formattedMobile.substring(0, 3) + "-" + formattedMobile.substring(3, 6) + "-" + formattedMobile.substring(6);
	}

	formatEmail(email: string, haveEmailPermission: YNStatusEnum = YNStatusEnum.NO) {
		if (!email) {
			return null;
		}
		const regex = /^([^@]+)@([^.]+)\.(.+)$/;
		const match = email.match(regex);
		let userName, domain, tld;
		try {
			if (match) {
				userName = match[1];
				domain = match[2];
				tld = match[3];
			} else {
				return null;
			}
		} catch (error) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.ERROR,
				"error_in_formatting_email",
				"utils",
				"CommonUtilityService",
				"formatEmail",
				error
			);
			appLoggerDto.addData(email);
			this.appLoggerService.writeLog(appLoggerDto);
			return null;
		}
		const replaceString = "x";
		const formattedEmail = userName[0] + replaceString.repeat(5) + "@" + domain[0] + replaceString.repeat(3) + "." + tld;
		return haveEmailPermission === YNStatusEnum.YES ? email : formattedEmail;
	}

	formatSsn(ssn: string, haveSsnPermission: YNStatusEnum = YNStatusEnum.NO) {
		if (!ssn) {
			return null;
		}
		const decryptedSsn = this.aesDecrypt(ssn);
		const formattedSsn = CommonUtilityService.replaceString(decryptedSsn, 0, decryptedSsn.length - 4, "X");
		return haveSsnPermission === YNStatusEnum.YES
			? decryptedSsn.substring(0, 3) + "-" + decryptedSsn.substring(3, 5) + "-" + decryptedSsn.substring(5)
			: formattedSsn.substring(0, 3) + "-" + formattedSsn.substring(3, 5) + "-" + formattedSsn.substring(5);
	}

	static replaceString(formattingString: string, start: number, end: number, replaceString: string) {
		if (end <= start) {
			return replaceString.repeat(formattingString.length - 1) + formattingString.slice(-1);
		}
		return formattingString.substring(0, start) + replaceString.repeat(end - start) + formattingString.substring(end);
	}

	currencyLocaleModifier(
		locale: string,
		currencyAmount: number,
		roundOffReq: boolean,
		symbol: string,
		currencySymbolRequired: boolean,
		formatingRequired: boolean,
		currencyCode: string
	) {
		if (isNaN(currencyAmount)) {
			return null;
		}
		if (!formatingRequired) {
			const decimalFormat = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
			return decimalFormat.format(currencyAmount);
		}

		const convStr = this.currencyLocale(locale, currencyAmount, currencySymbolRequired, symbol, currencyCode);
		if (!convStr) {
			return currencyAmount;
		}

		if (roundOffReq) {
			return convStr;
		}

		return convStr;
	}

	currencyLocale(
		localeCode: string,
		currencyAmount: number,
		symbolRequired: boolean,
		symbol: string,
		currencyCode: string
	) {
		const locale = localeCode;
		try {
			const currencyFormatter = new Intl.NumberFormat(locale, { style: "currency", currency: currencyCode });
			const currency = new Intl.NumberFormat(locale, { style: "currency", currency: currencyCode }).formatToParts()[0]
				.value;

			if (symbolRequired) {
				return currencyFormatter.format(currencyAmount);
			} else {
				const currencyWithoutSymbol = currencyFormatter.format(currencyAmount).replace(currency, "");
				return symbol + currencyWithoutSymbol;
			}
		} catch (e) {
			// DONOTHING
			console.log(e);
		}
		return null;
	}

	capitalizeWords(str) {
		if (!str) {
			return str;
		}
		return str.replace(/\b\w/g, (match) => match.toUpperCase());
	}

	async getPiiPermissionData(userId: number) {
		const piiDataPermissions = await this.userDaoService.getUserPiiPermissionData(userId);
		const phonePermission = piiDataPermissions?.phone || YNStatusEnum.NO;
		const ssnPermission = piiDataPermissions?.ssn || YNStatusEnum.NO;
		const emailPermission = piiDataPermissions?.email || YNStatusEnum.NO;
		return { phonePermission, ssnPermission, emailPermission };
	}

	aesDecrypt(encryptedString: string) {
		const key = this.configService.get("AES_DECRYPTION_KEY").toString();
		const iv = this.configService.get("AES_DECRYPTION_IV").toString();
		try {
			const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
			let decrypted = decipher.update(encryptedString, "base64", "utf8");
			decrypted += decipher.final("utf8");
			return decrypted;
		} catch (error) {
			console.error("Decryption error:", error);
			return encryptedString;
		}
	}

	createDisplayRefdocId(refdocId: number, documentPresent: YNStatusEnum, buisnessType: BuisnessTypeEnum, refdocTypeData) {
		let displayRefdocId;
		if (buisnessType === BuisnessTypeEnum.B2B) {
			displayRefdocId = BuisnessTypeCodeEnum.B2B;
		} else {
			displayRefdocId = BuisnessTypeCodeEnum.B2C;
		}
		if (refdocTypeData.serviceCode === "RENT") {
			displayRefdocId += RefDocTypeCodeEnum.LEASE;
		} else {
			displayRefdocId += RefDocTypeCodeEnum.UTILITY;
		}
		if (documentPresent === YNStatusEnum.YES) {
			displayRefdocId += DocumentPresentCodeEnum.DOCUMENT;
		} else {
			displayRefdocId += DocumentPresentCodeEnum.NO_DOCUMENT;
		}
		displayRefdocId += refdocId.toString().padStart(6, "0");
		return displayRefdocId;
	}

	createReceiptObj(doc) {
		const receiptObjArr = doc.map((data) => {
			const receiptObj = {};
			receiptObj["uploadedDate"] = new Date();
			receiptObj["receiptUrl"] = data;
			receiptObj["status"] = ReceiptStatusEnum.REQUESTED;
			return receiptObj;
		});
		return receiptObjArr;
	}

	async getDataforCurrencyFormatting(configs: Map<string, string>) {
		const currencyCode = configs.get(ConfigCodeEnum.CURRENCY_CODE);
		const roundOffReq = configs.get(ConfigCodeEnum.ROUND_OFF_REQUIRED);
		const displaySymbol = configs.get(ConfigCodeEnum.DISPLAY_CURRENCY_SYMBOL);
		const formattingReq = configs.get(ConfigCodeEnum.AMOUNT_FORMATTING_REQUIRED);
		const currencyData = await this.commonDaoService.findByCurrencyCode(currencyCode);
		return { currencyCode, roundOffReq, displaySymbol, formattingReq, currencyData };
	}

	formatCurrency(currencyFormattingData, amount: number) {
		const { currencyCode, roundOffReq, displaySymbol, formattingReq, currencyData } = currencyFormattingData;
		const formattedAmount = this.currencyLocaleModifier(
			currencyData.localeCode,
			amount,
			roundOffReq === YesNoEnum.YES,
			currencyData.currencySymbol,
			displaySymbol === YesNoEnum.YES,
			formattingReq === YesNoEnum.YES,
			currencyCode
		);
		return formattedAmount;
	}

	async getMonthlyProofIdsForReuploadedStatus(status: any) {
		const masterProofIds = [];
		const monthlyProofIds = [];
		const reportingYears = [];
		const reportingMonths = [];
		const masterProofIdMapObj = {};
		let refdocStatus = status?.split(",");

		if (
			refdocStatus.includes(MonthlyProofStatusEnum.REUPLOADED) ||
			refdocStatus.includes(MonthlyProofStatusEnum.NEWLY_UPLOADED)
		) {
			const monthlyProofData = await this.monthlyDocDaoService.getMasterProofIdReportingMonthYearByStatus(
				MonthlyProofStatusEnum.REJECTED
			);
			monthlyProofData.forEach((obj) => {
				masterProofIdMapObj[obj.masterProofId] = `${obj.reportingMonth},${obj.reportingYear}`;
				if (!masterProofIds.includes(obj.masterProofId)) {
					masterProofIds.push(obj.masterProofId);
				}
				if (!reportingYears.includes(obj.reportingYear)) {
					reportingYears.push(obj.reportingYear);
				}

				if (!reportingMonths.includes(obj.reportingMonth)) {
					reportingMonths.push(obj.reportingMonth);
				}
			});
			const monthlyProofIdObjArr = await this.monthlyDocDaoService.getMonthlyProofByMasterProofIdsReportingYearsMonths(
				masterProofIds,
				reportingMonths,
				reportingYears
			);
			monthlyProofIdObjArr.forEach((obj) => {
				if (
					!monthlyProofIds.includes(obj.id) &&
					`${obj.reportingMonth},${obj.reportingYear}` == masterProofIdMapObj[obj.masterProofId]
				) {
					monthlyProofIds.push(obj.id);
				}
			});
		}

		return monthlyProofIds;
	}
}
