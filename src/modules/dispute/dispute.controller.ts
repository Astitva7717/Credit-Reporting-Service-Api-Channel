import { Body, Controller, Get, Post, Query, Request, UseGuards, UseInterceptors } from "@nestjs/common";
import { DisputeService } from "./dispute.service";
import { AuthenticationGuard } from "@utils/guards/authentication/authentication-gaurd";
import { RequetsValidationGuard } from "@utils/guards/validation/request-validation.guard";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiHeader, ApiHeaders, ApiOperation, ApiTags } from "@nestjs/swagger";
import { GetDisputeDto } from "./dto/get-disputes.dto";
import postloginDto from "@modules/doc/dto/postlogin.dto";
import { GetDistputeHistoryDto } from "./dto/get-dispute-history.dto";
import { RaiseDisputeDto } from "./dto/raise-dispute.dto";
import { FileFieldsInterceptor, UploadedFiles } from "@blazity/nest-file-fastify";
import { AddDisputeCommentSchemaDto, CreateDisputeSchemaDto } from "./dto/add-dispute-schema.dto";
import { AddDisputeCommentDto } from "./dto/add-dispute-comment.dto";
import { ResolveDisputeDto } from "./dto/resolve-dispute.dto";
import { ChangeDisputeStatusDto } from "./dto/change-dispute-status.dto";

@UseGuards(AuthenticationGuard, RequetsValidationGuard)
@ApiTags("Dispute Management")
@Controller("")
export class DisputeController {
	constructor(private readonly disputeService: DisputeService) {}

	//v1.0
	@Get("v1.0/getDisputes")
	@ApiOperation({ summary: "Get disputes." })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	getDisputes(@Query() getDisputeDto: GetDisputeDto, @Request() request) {
		return this.disputeService.getDisputes(getDisputeDto, request);
	}

	@Get("v1.0/getDisputeHistory")
	@ApiOperation({ summary: "Get dispute history backoffice." })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	getDisputeHistoryBackoffice(@Query() getDisputeHistoryDto: GetDistputeHistoryDto, @Request() request: Request) {
		return this.disputeService.getDisputeHistoryBackoffice(getDisputeHistoryDto, request);
	}

	@Post("v1.0/addDisputeComment")
	@ApiOperation({ summary: "Add dispute comment from backoffice." })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	addDisputeCommentFromBackoffice(@Body() addDisputeCommentDto: AddDisputeCommentDto, @Request() request) {
		return this.disputeService.addDisputeCommentFromBackoffice(addDisputeCommentDto, request);
	}

	@Post("v1.0/resolveDispute")
	@ApiOperation({ summary: "Resolve dispute from backoffice." })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	resolveDispute(@Body() resolveDisputeDto: ResolveDisputeDto, @Request() request) {
		return this.disputeService.resolveDisputeBackoffice(resolveDisputeDto, request);
	}

	@Post("v1.0/changeDisputeStatus")
	@ApiOperation({ summary: "Change dispute status." })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	changeDisputeStatus(@Body() changeDisputeStatusDto: ChangeDisputeStatusDto) {
		return this.disputeService.changeDisputeStatus(changeDisputeStatusDto);
	}

	@Post("v1.0/askForReceipt")
	@ApiOperation({ summary: "Ask for receipt." })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	askForReceipt(@Body() askForReceiptDto: GetDistputeHistoryDto, @Request() request) {
		return this.disputeService.addReceiptRequestInDisputeHistory(askForReceiptDto, request);
	}

	//postLogin;
	@Get("postLogin/getDisputeTypes")
	@ApiOperation({ summary: "Get disputes types." })
	@ApiHeaders(postloginDto)
	getDisputeTypes() {
		return this.disputeService.getDisputeTypes();
	}

	@Get("v1.0/getDisputeTypes")
	@ApiOperation({ summary: "Get disputes types." })
	@ApiHeaders(postloginDto)
	getDisputeTypesBackoffice() {
		return this.disputeService.getDisputeTypes();
	}

	@Get("postLogin/getDisputeHistory")
	@ApiOperation({ summary: "Get dispute history app." })
	@ApiHeaders(postloginDto)
	getDisputeHistoryApp(@Query() getDisputeHistoryDto: GetDistputeHistoryDto, @Request() request) {
		return this.disputeService.getDisputeHistoryApp(getDisputeHistoryDto, request);
	}

	@Post("postLogin/addDisputeComment")
	@ApiOperation({ summary: "Add dispute comment from app." })
	@ApiHeaders(postloginDto)
	@ApiConsumes("multipart/form-data")
	@ApiBody({
		schema: AddDisputeCommentSchemaDto
	})
	@UseInterceptors(FileFieldsInterceptor([{ name: "fileA", maxCount: 5 }]))
	addDisputeCommentFromApp(
		@UploadedFiles() files: Record<string, Express.Multer.File[]>,
		@Body() addDisputeCommentDto: AddDisputeCommentDto,
		@Request() request
	) {
		return this.disputeService.addDisputeCommentFromApp(files, addDisputeCommentDto, request);
	}

	@Post("postLogin/raiseDispute")
	@ApiOperation({ summary: "Raise dispute." })
	@ApiHeaders(postloginDto)
	@ApiConsumes("multipart/form-data")
	@ApiBody({
		schema: CreateDisputeSchemaDto
	})
	@UseInterceptors(
		FileFieldsInterceptor([
			{ name: "fileA", maxCount: 5 },
			{ name: "fileB", maxCount: 5 }
		])
	)
	raiseDispute(
		@UploadedFiles() files: Record<string, Express.Multer.File[]>,
		@Body() raiseDisputeDto: RaiseDisputeDto,
		@Request() request
	) {
		return this.disputeService.raiseDispute(files, raiseDisputeDto, request);
	}
}
