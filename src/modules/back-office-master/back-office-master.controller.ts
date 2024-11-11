import { Controller, Get, Request, Req, UseGuards, Query, Post, Body } from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiBody,
	ApiHeader,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiTags
} from "@nestjs/swagger";
import VariablesConstant from "src/utils/variables-constant";
import { BackOfficeMasterService } from "./back-office-master.service";
import { AuthenticationGuard } from "@utils/guards/authentication/authentication-gaurd";
import { RequetsValidationGuard } from "@utils/guards/validation/request-validation.guard";

@UseGuards(AuthenticationGuard, RequetsValidationGuard)
@ApiTags("BackOffice Management")
@Controller("")
@ApiBearerAuth("access-token")
export class BackOfficeMasterController {
	constructor(private backOfficeService: BackOfficeMasterService) {}

	@Post("v1.0/getUserMenus")
	// @ApiHeaders([
	// 	{ name: "Authorization", description: "Bearer Token", required: true },
	// 	{ name: "backofficeToken", description: "Is backoffice token", required: true }
	// ])
	// @ApiHeader({ name: 'Authorization', description: 'Bearer Token', required: true })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiOperation({ summary: "Fetch User Menus From BackOffice" })
	@ApiResponse({
		status: 200,
		description: "User Menus",
		type: ""
	})
	@ApiBody({
		description: "Request body description",
		schema: {
			properties: {
				userId: { type: "number" },
				appType: { type: "string" },
				engineCode: { type: "string" },
				languageCode: { type: "string" },
				userRequired: { type: "string" }
			}
		}
	})
	getUserMenus(
		@Body(VariablesConstant.USER_ID) userId,
		@Req() request,
		@Body("appType") appType: string,
		@Body("engineCode") engineCode: string,
		@Body("languageCode") languageCode: string,
		@Body("userRequired") userRequired: string
	) {
		return this.backOfficeService.getUserMenu(userId, appType, engineCode, languageCode, userRequired, request);
	}

	@Get("v1.0/validateUser")
	@ApiOperation({ summary: "Validate User From BackOffice" })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiResponse({
		status: 200,
		description: "User Menus",
		type: ""
	})
	@ApiQuery({ name: "userId", type: "number", required: true })
	validateUser(@Query(VariablesConstant.USER_ID) userId, @Request() request) {
		return this.backOfficeService.validateUser(userId, request);
	}

	@Get("v1.0/getLoginData")
	@ApiOperation({ summary: "Fetch Login User Data From BackOffice" })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiResponse({
		status: 200,
		description: "Login Data",
		type: ""
	})
	getLoginData(@Req() request) {
		return this.backOfficeService.getLoginDataBO(request);
	}
}
