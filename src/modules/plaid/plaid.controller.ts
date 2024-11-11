import { Body, Controller, Get, Post, Query, Request, UseGuards } from "@nestjs/common";
import { PlaidService } from "./plaid.service";
import { AuthenticationGuard } from "@utils/guards/authentication/authentication-gaurd";
import { RequetsValidationGuard } from "@utils/guards/validation/request-validation.guard";
import { ApiBearerAuth, ApiHeader, ApiHeaders, ApiOperation, ApiQuery } from "@nestjs/swagger";
import postloginDto from "@modules/doc/dto/postlogin.dto";
import { GenerateLinkTokenDto } from "./dto/generate-link-token.dto";
import { GenerateAccessTokenDto } from "./dto/generate-token.dto";
import { GetAccountDetailsDto } from "./dto/get-acc-details.dto";

@UseGuards(AuthenticationGuard, RequetsValidationGuard)
@Controller("")
export class PlaidController {
	constructor(private readonly plaidService: PlaidService) {}

	@Get("postLogin/plaid/generateLinkToken")
	@ApiOperation({ summary: "Generate link token for user" })
	@ApiHeaders(postloginDto)
	getLinkToken(@Query() body: GenerateLinkTokenDto, @Request() request) {
		return this.plaidService.getLinkToken(body, request);
	}

	@Post("postLogin/plaid/generateAccessToken")
	@ApiOperation({ summary: "Generate access token for user" })
	@ApiHeaders(postloginDto)
	getAccessToken(@Body() body: GenerateAccessTokenDto, @Request() request) {
		return this.plaidService.getAccessToken(body, request);
	}

	@Get("postLogin/plaid/getAccountDetails")
	@ApiOperation({ summary: "Get user palid account details." })
	@ApiHeaders(postloginDto)
	getAccDetails(@Query() query: GetAccountDetailsDto, @Request() request) {
		return this.plaidService.getAccDetails(query, request);
	}

	@Get("postLogin/plaid/getUserAccounts")
	@ApiOperation({ summary: "Get user palid account by payment type." })
	@ApiHeaders(postloginDto)
	@ApiQuery({ name: "paymentType", type: "string", required: true })
	getUserAccounts(@Query() query: { paymentType: string }, @Request() request) {
		return this.plaidService.getUserPlaidAccounts(query.paymentType, request);
	}

	@Get("postLogin/getPlaidAccountInfo")
	@ApiOperation({ summary: "Get Plaid account's info." })
	@ApiHeaders(postloginDto)
	getPlaidAccountInfo(@Request() request) {
		return this.plaidService.getPlaidAccountInfo(request);
	}

	@Get("v1.0/getPlaidCategories")
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiOperation({ summary: "Get Plaid txn categories." })
	getPlaidCategories() {
		return this.plaidService.getPlaidTxnCategories();
	}
}
