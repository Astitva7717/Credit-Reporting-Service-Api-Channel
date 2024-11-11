import { Body, Controller, Get, Post, Query, Request, UseGuards, UseInterceptors } from "@nestjs/common";
import { MonthlyProofService } from "./monthly-proof.service";
import {
	ApiBearerAuth,
	ApiBody,
	ApiConsumes,
	ApiHeader,
	ApiHeaders,
	ApiOperation,
	ApiResponse,
	ApiTags
} from "@nestjs/swagger";
import postloginDto from "@modules/doc/dto/postlogin.dto";
import { FileFieldsInterceptor, UploadedFiles } from "@blazity/nest-file-fastify";
import { GetMontlyProofDto } from "./dto/get-monthly-proofs.dto";
import { ApproveMonthlyProofDto } from "./dto/approve-monthly-proof.dto";
import { SaveMonthlyProofDto } from "./dto/save-monthly-proof.dto";
import { GetMontlyProofFullDetailsDto } from "./dto/monthly-proof-full-details.dto";
import { MonthlyProofsDto } from "./dto/monthly-proofs.dto";
import { AuthenticationGuard } from "@utils/guards/authentication/authentication-gaurd";
import { RequetsValidationGuard } from "@utils/guards/validation/request-validation.guard";
import { RejectPlaidDto } from "./dto/reject-plaid-transaction.dto";
import { CreditorDropdownDto } from "./dto/creditor-dropdown-dto";
import { QualifyPlaidTxnsDto } from "./dto/qualify-plaid-txns.dto";
import { GetCreditorPayPlaidDataDto } from "./dto/get-creditor-pay-plaid.dto";
import { GetCreditorPayPlaidDetailsDto } from "./dto/get-creditor-pay-plaid-details.dto";
import { RejectSelectedPlaidTxnDto } from "./dto/reject-selected-plaid-txn.dto";
import { GetPlaidTxnsDto } from "./dto/get-plaid-txns.dto";
import { AssignMonthDto } from "./dto/assign-month-dto";
require("dotenv").config();

@UseGuards(AuthenticationGuard, RequetsValidationGuard)
@ApiTags("Monthly Proofs Management.")
@Controller("")
export class MonthlyProofController {
	constructor(private readonly monthlyProofService: MonthlyProofService) {}

	@Get("v1.0/getCreditorsDropdown")
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiOperation({ summary: "Get creditors dropdown." })
	getCreditorsAndCategoryDropdown(@Query() creditorDropdownDto: CreditorDropdownDto) {
		return this.monthlyProofService.getCreditorsAndCategoryDropdown(creditorDropdownDto);
	}

	//v1.0
	@Get("v1.0/monthlyProofs")
	@ApiOperation({ summary: "Get Monthly Proofs." })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiResponse({
		status: 200,
		description: "Get Doc Monthly Proof",
		type: ""
	})
	async getDocMonthlyProof(@Query() getMontlyProofDto: GetMontlyProofDto, @Request() request) {
		return this.monthlyProofService.getDocMonthlyProof(getMontlyProofDto, request);
	}

	@Get("v1.0/getCreditorPayPlaidData")
	@ApiOperation({ summary: "Get Creditor Pay Plaid Data." })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiResponse({
		status: 200,
		description: "Get Creditor Pay Plaid Data.",
		type: ""
	})
	async getCreditorPayPlaidData(@Query() getCrediotorPayPlaidDto: GetCreditorPayPlaidDataDto) {
		return this.monthlyProofService.getCreditorPayPlaidData(getCrediotorPayPlaidDto);
	}

	@Get("v1.0/monthlyProofFullDetail")
	@ApiOperation({ summary: "Get Monthly Proof Full details." })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiResponse({
		status: 200,
		description: "Get Monthly Proof details.",
		type: ""
	})
	async getDocMonthlyProofFullDetails(
		@Query() getMontlyProofFullDetailsDto: GetMontlyProofFullDetailsDto,
		@Request() request
	) {
		return this.monthlyProofService.getDocMonthlyProofFullDetails(getMontlyProofFullDetailsDto, request);
	}

	@Get("v1.0/getCreditorPayPlaidDetails")
	@ApiOperation({ summary: "Get Plaid Txns Full details." })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiResponse({
		status: 200,
		description: "Get Plaid Txns Full details.",
		type: ""
	})
	async getCreditorPayPlaidDetails(
		@Query() getCreditorPayPlaidDetailsDto: GetCreditorPayPlaidDetailsDto,
		@Request() request
	) {
		return this.monthlyProofService.getCreditorPayPlaidDetails(getCreditorPayPlaidDetailsDto, request);
	}

	@Post("v1.0/monthlyProofUpdateStatus")
	@ApiOperation({ summary: "Update Doc Monthly Proof" })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiResponse({
		status: 200,
		description: "Update Doc Monthly Proof",
		type: ""
	})
	async docMonthlyProofUpdateStatus(@Body() approveMonthlyProofDto: ApproveMonthlyProofDto, @Request() request) {
		return this.monthlyProofService.docMonthlyProofUpdateStatus(approveMonthlyProofDto, request);
	}

	@Post("v1.0/qualifyTransactions")
	@ApiOperation({ summary: "Qualifies Plaid Transactions" })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiResponse({
		status: 200,
		description: "Qualifies Plaid Transactions",
		type: ""
	})
	async qualifyPlaidTxns(@Body() qualifyPlaidTxnsDto: QualifyPlaidTxnsDto) {
		return this.monthlyProofService.qualifyPlaidTxns(qualifyPlaidTxnsDto);
	}

	@Post("v1.0/assignMonth")
	@ApiOperation({ summary: "Assigns Month to the CryrBot Qualified or CryrEmp Qualified txns" })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiResponse({
		status: 200,
		description: "Assigns Month to the CryrBot Qualified or CryrEmp Qualified txns",
		type: ""
	})
	async assignMonth(@Body() assignMonthDto: AssignMonthDto) {
		return this.monthlyProofService.assignMonth(assignMonthDto);
	}

	@Get("v1.0/getPlaidTxnsForUserRefdoc")
	@ApiOperation({ summary: "Get Plaid Txns user refdoc" })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiResponse({
		status: 200,
		description: "Get Plaid Txns user refdoc.",
		type: ""
	})
	async getPlaidTxnsForUserRefdoc(@Query() getPlaidTxnsDto: GetPlaidTxnsDto, @Request() request) {
		return this.monthlyProofService.getPlaidTxns(getPlaidTxnsDto);
	}

	@Post("v1.0/rejectPlaidTransaction")
	@ApiOperation({ summary: "Reject Approved Plaid Transaction" })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiResponse({
		status: 200,
		description: "Reject Plaid Transaction",
		type: ""
	})
	async rejectPlaidTransaction(@Body() rejectPlaidDto: RejectPlaidDto, @Request() request) {
		return this.monthlyProofService.rejectPlaidTransaction(rejectPlaidDto, request);
	}

	@Post("v1.0/rejectSelectedPlaidTransaction")
	@ApiOperation({ summary: "Reject Approved Plaid Transaction" })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiResponse({
		status: 200,
		description: "Reject Plaid Transaction",
		type: ""
	})
	async rejectSelectedPlaidTransaction(@Body() rejectSelectedPlaidDto: RejectSelectedPlaidTxnDto, @Request() request) {
		return this.monthlyProofService.rejectSelectedPlaidTxn(rejectSelectedPlaidDto);
	}

	//postLogin
	@Post("postLogin/saveMonthlyProof")
	@ApiOperation({ summary: "Save monthly proof data." })
	@ApiHeaders(postloginDto)
	@ApiConsumes("multipart/form-data")
	@ApiBody({
		schema: {
			type: "object",
			properties: {
				proofIdValue: { type: "string" },
				masterProofType: { type: "string" },
				monthlyProofType: { type: "string" },
				proofPath: { type: "string" },
				proofDetail: { type: "string" },
				amount: { type: "string" },
				file: {
					type: "string",
					format: "binary"
				},
				additionalFiles: {
					type: "string",
					format: "binary"
				}
			}
		}
	})
	@UseInterceptors(
		FileFieldsInterceptor([
			{ name: "files", maxCount: +process.env.MAX_MONTHLY_PROOF_FILES_COUNT },
			{ name: "additionalFiles", maxCount: +process.env.MAX_MONTHLY_PROOF_FILES_COUNT }
		])
	)
	async saveMonthlyProof(
		@UploadedFiles() files: Record<string, Express.Multer.File[]>,
		@Body() body: SaveMonthlyProofDto,
		@Request() request
	) {
		return await this.monthlyProofService.saveMonthlyProof(files, body, request);
	}

	@Get("postLogin/monthlyProofs")
	@ApiOperation({ summary: "Get monthly proof data for refdoc." })
	@ApiHeaders(postloginDto)
	@ApiResponse({
		status: 200,
		description: "Monthly Proofs details.",
		type: ""
	})
	async getUserMonthlyProofsForRefdoc(@Query() monthlyProofsDto: MonthlyProofsDto, @Request() request) {
		return this.monthlyProofService.getUserMonthlyProofsForRefdoc(monthlyProofsDto, request);
	}

	@Get("postLogin/getApprovedProofs")
	@ApiOperation({ summary: "Get approved proofs data by month and year." })
	@ApiHeaders(postloginDto)
	getApprovedProofs(@Query() monthlyProofsDto: MonthlyProofsDto, @Request() request) {
		return this.monthlyProofService.getApprovedProofs(monthlyProofsDto, request);
	}
}
