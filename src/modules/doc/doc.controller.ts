import { Controller, Get, Post, Body, Query, Request, UseInterceptors, UseGuards } from "@nestjs/common";
import { DocService } from "./doc.service";
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
import { ApproveRefDocDto } from "./dto/approve-ref-doc.dto";
import { FileInterceptor, UploadedFile, MemoryStorageFile } from "@blazity/nest-file-fastify";
import { UpdateMasterProofDto } from "./dto/update.masterProof.dto";
import FormData from "form-data";
import { RefDocIdDto } from "@modules/plaid/dto/refdoc-id.dto";
import { GetRefdocDto } from "./dto/getrefdoc.dto";
import { DocMasterProofDto } from "./dto/getdoc-master-proof.dto";
import postloginDto from "./dto/postlogin.dto";
import { RentDetailsDto } from "./dto/rent-details.dto";
import { SaveMasterProofDto } from "./dto/save-master-proof.dto";
import { UpdateRefdocDto } from "./dto/update-refdoc.dto";
import { AuthenticationGuard } from "@utils/guards/authentication/authentication-gaurd";
import { RequetsValidationGuard } from "@utils/guards/validation/request-validation.guard";
import { SaveRentPaymentDetails } from "./dto/rent-payment-details.dto";
import { GetDropDownOptionsDto } from "./dto/dropdown-options-dto";

@UseGuards(AuthenticationGuard, RequetsValidationGuard)
@ApiTags("Doc Management")
@Controller("")
export class DocController {
	constructor(private readonly docService: DocService) {}

	//v1.0
	@Get("v1.0/userDocMasterProof")
	@ApiOperation({ summary: "Get ref doc master proof" })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiResponse({
		status: 200,
		description: "Get Doc Master Proof",
		type: ""
	})
	docMasterProof(@Query() docMasterProofDto: DocMasterProofDto,@Request() request) {
		return this.docService.docMasterProof(docMasterProofDto, request);
	}

	@Get("v1.0/getRefdocMaster")
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiOperation({ summary: "Get Refdoc Master" })
	@ApiResponse({
		status: 200,
		description: "Refdoc Master data",
		type: ""
	})
	getRefdocMaster(@Query() body: GetRefdocDto, @Request() request) {
		return this.docService.getRefdocMaster(body, request);
	}

	@Get("v1.0/getRefdocDetails")
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiOperation({ summary: "Get Refdoc Master" })
	@ApiResponse({
		status: 200,
		description: "Refdoc Master data",
		type: ""
	})
	getRefdocDetails(@Query() body: RefDocIdDto, @Request() request) {
		return this.docService.getRefdocDetails(body, request);
	}

	@Post("v1.0/refDocConfirmation")
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiOperation({ summary: "Update Refdoc Master status" })
	approveRefDoc(@Body() body: ApproveRefDocDto, @Request() request) {
		return this.docService.updateRefDocStatus(body, request);
	}

	@Get("v1.0/rejectionReasons")
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiOperation({ summary: "Get ref doc rejection reasons." })
	getRejectionReasons() {
		return this.docService.getRejectionReasons();
	}

	@Get("v1.0/notSignedOptions")
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiOperation({ summary: "Get refdoc not signed options." })
	getNotSignedOptions() {
		return this.docService.getNotSignedOptions();
	}

	@Get("v1.0/getMoneyOrderSources")
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiOperation({ summary: "Get money order sources." })
	getMoneyOrderSources() {
		return this.docService.getMoneyOrderSources();
	}

	@Get("v1.0/getDropdownOptions")
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiOperation({ summary: "Get dropdowns for cryr pages." })
	getDropdownOptions(@Query() getDropdownOptionsDto: GetDropDownOptionsDto) {
		return this.docService.getDropdownOptions(getDropdownOptionsDto)
	}

	@Get("v1.0/getLeaseFormats")
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiOperation({ summary: "Get lease formats." })
	getLeaseFormats() {
		return this.docService.getLeaseFormats();
	}

	@Get("v1.0/refdocHistoryData")
	@ApiOperation({ summary: "Get refdoc history data." })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	refdocHistoryDataBackoffice(@Query() refDocIdDto: RefDocIdDto) {
		return this.docService.refdocHistoryDataBackoffice(refDocIdDto);
	}

	//preLogin
	@Post("preLogin/getRefDocTypes")
	@ApiHeaders([{ name: "clientCode", description: "Client Code", required: true }])
	@ApiOperation({ summary: "Get All RefDocTypes" })
	getRefDocTypes(@Request() request) {
		return this.docService.getRefDocTypes(request);
	}

	//postLogin
	@Post("postLogin/uploadRefdoc")
	@ApiOperation({ summary: "Upload Refdoc" })
	@ApiHeaders(postloginDto)
	@ApiResponse({
		status: 200,
		description: "Upload Refdoc",
		type: ""
	})
	@ApiConsumes("multipart/form-data")
	@ApiBody({
		schema: {
			type: "object",
			properties: {
				refdocTypeId: { type: "integer" },
				file: {
					type: "string",
					format: "binary"
				},
				paymentId: { type: "integer" }
			}
		}
	})
	@UseInterceptors(FileInterceptor("file"))
	async uploadRefdoc(@UploadedFile() file: MemoryStorageFile, @Body() body: FormData, @Request() request) {
		return this.docService.uploadRefdoc(file, body, request);
	}

	@Post("postLogin/leaseData")
	@ApiOperation({ summary: "Save lease data." })
	@ApiHeaders(postloginDto)
	async leaseData(@Body() body: RentDetailsDto, @Request() request) {
		return this.docService.leaseData(body, request);
	}

	@Post("postLogin/saveRentDetails")
	@ApiOperation({ summary: "Save rent payment detais." })
	@ApiHeaders(postloginDto)
	async saveRentDetails(@Body() body: SaveRentPaymentDetails, @Request() request) {
		return this.docService.saveRentPaymentDetails(body, request);
	}

	@Post("postLogin/saveMasterProof")
	@ApiOperation({ summary: "Save validation doc master proof data." })
	@ApiHeaders(postloginDto)
	@ApiConsumes("multipart/form-data")
	@ApiBody({
		schema: {
			type: "object",
			properties: {
				refdocId: { type: "string" },
				masterProofType: { type: "string" },
				paymentType: { type: "string" },
				isOtherPayee: { type: "string" },
				benificiaryUserId: { type: "string" },
				file: {
					type: "string",
					format: "binary"
				},
				plaidTokenId: {
					type: "string"
				}
			}
		}
	})
	@UseInterceptors(FileInterceptor("file"))
	async saveValidationDocMasterProof(
		@UploadedFile() file: MemoryStorageFile,
		@Body() saveMasterProofDto: SaveMasterProofDto,
		@Request() request
	) {
		return this.docService.saveValidationDocMasterProof(file, saveMasterProofDto, request);
	}

	@Post("postLogin/updateRefdoc")
	@ApiOperation({ summary: "Upadte ref doc." })
	@ApiHeaders(postloginDto)
	@ApiConsumes("multipart/form-data")
	@ApiBody({
		schema: {
			type: "object",
			properties: {
				refdocId: { type: "string" },
				file: {
					type: "string",
					format: "binary"
				}
			}
		}
	})
	@UseInterceptors(FileInterceptor("file"))
	async updateRefdoc(
		@UploadedFile() file: MemoryStorageFile,
		@Body() updateRefdocDto: UpdateRefdocDto,
		@Request() request
	) {
		return this.docService.updateRefdoc(file, updateRefdocDto, request);
	}

	@Get("postLogin/getUserRefdocDetails")
	@ApiOperation({ summary: "Get User all refdoc details." })
	@ApiHeaders(postloginDto)
	async getUserRefdocDetails(@Request() request) {
		return this.docService.getUserRefdocDetails(request);
	}

	@Get("postLogin/getRefdocFullDetails")
	@ApiOperation({ summary: "Get refdoc participant, masterproof and subscription details." })
	@ApiHeaders(postloginDto)
	async getRefdocFullDetails(@Query() refDocIdDto: RefDocIdDto, @Request() request) {
		return this.docService.getRefdocFullDetails(refDocIdDto, request);
	}

	@Post("postLogin/deleteMasterProofstatus")
	@ApiOperation({ summary: "Update masterproof status" })
	@ApiHeaders([
		{ name: "userId", description: "User Id", required: true },
		{ name: "userToken", description: "User Token", required: true },
		{ name: "aliasName", description: "Alias name", required: true }
	])
	@ApiBody({
		schema: {
			type: "object",
			properties: {
				masterProofId: { type: "string" }
			}
		}
	})
	deleteMasterProofStatus(@Body() updateMasterProofDto: UpdateMasterProofDto) {
		return this.docService.deleteMasterProofStatus(updateMasterProofDto);
	}

	@Post("postLogin/refdocSuccess")
	@ApiOperation({ summary: "Confirm  refdoc data flow." })
	@ApiHeaders(postloginDto)
	refdocDataComplete(@Body() refDocIdDto: RefDocIdDto, @Request() request) {
		return this.docService.refdocDataComplete(refDocIdDto, request);
	}

	@Get("postLogin/refdocHistoryData")
	@ApiOperation({ summary: "Get refdoc history data." })
	@ApiHeaders(postloginDto)
	refdocHistoryData(@Query() refDocIdDto: RefDocIdDto, @Request() request) {
		return this.docService.refdocHistoryData(refDocIdDto, request);
	}
}
