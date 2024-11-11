import { Controller, Get, Post, Body, UseGuards, Req, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiHeaders, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AliasMasterService } from "./alias-master.service";
import { AliasRequestBean } from "./dto/alias-request.dto";
import { AuthenticationGuard } from "@utils/guards/authentication/authentication-gaurd";
import { RequetsValidationGuard } from "@utils/guards/validation/request-validation.guard";

@UseGuards(AuthenticationGuard, RequetsValidationGuard)
@ApiTags("Alias Management")
@Controller("")
export class AliasMasterController {
	constructor(private readonly aliasMasterService: AliasMasterService) {}

	@Get("v1.0/getChannelAlias")
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiOperation({ summary: "Can Get Channel Alias" })
	@ApiResponse({
		status: 200,
		description: "Channel Alias",
		type: ""
	})
	@ApiQuery({ name: "businessId", type: "number", required: true })
	@ApiQuery({ name: "channelId", type: "number", required: true })
	async getChannelAlias(@Query("businessId") businessId: number, @Query("channelId") channelId: number, @Req() request) {
		return this.aliasMasterService.getChannelAlias(businessId, channelId, request);
	}

	@Post("client/aliasRegistration")
	@ApiOperation({ summary: "Create Alias" })
	@ApiResponse({
		status: 200,
		description: "Business Registration",
		type: ""
	})
	@ApiHeaders([
		{ name: "clientCode", description: "Client Code", required: true },
		{ name: "clientPwd", description: "Client Password", required: true }
	])
	createAlias(@Body() createAliasRequest: AliasRequestBean) {
		return this.aliasMasterService.createAlias(createAliasRequest);
	}

	@Post("client/updateAlias")
	@ApiOperation({ summary: "Update Alias" })
	@ApiResponse({
		status: 200,
		description: "Update Alias",
		type: ""
	})
	@ApiHeaders([
		{ name: "clientCode", description: "Client Code", required: true },
		{ name: "clientPwd", description: "Client Password", required: true }
	])
	updateAlias(@Body() updateAliasRequest: AliasRequestBean) {
		return this.aliasMasterService.updateAlias(updateAliasRequest);
	}
}
