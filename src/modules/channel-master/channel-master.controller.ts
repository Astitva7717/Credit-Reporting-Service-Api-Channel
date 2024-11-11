import { Body, Controller, Get, Query, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiHeaders, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ChannelMasterService } from "./channel-master.service";
import { ConfigurationService } from "../../utils/configuration/configuration.service";
import { ChannelRegistrationRequest } from "./dto/channel-registration-request";
import { UpdateChannelRequest } from "./dto/update-channel-request";
import { UpdateConfigurationsRequest } from "./dto/update-configurations-request";
import { AuthenticationGuard } from "@utils/guards/authentication/authentication-gaurd";
import { RequetsValidationGuard } from "@utils/guards/validation/request-validation.guard";

@UseGuards(AuthenticationGuard, RequetsValidationGuard)
@ApiTags("Channel Management")
@Controller("")
export class ChannelMasterController {
	constructor(
		private readonly channelMasterService: ChannelMasterService,
		private configurationService: ConfigurationService
	) {}

	@Get("v1.0/getChannelList")
	@ApiOperation({ summary: "CAN_FETCH_CHANNEL" })
	@ApiResponse({
		status: 200,
		description: "channelList",
		type: ""
	})
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiQuery({ name: "businessId", type: "number", required: true })
	getChannelList(@Query("businessId") businessId: number, @Req() request) {
		return this.channelMasterService.getChannelList(businessId, request);
	}

	@Post("client/channelRegistration")
	@ApiOperation({ summary: "CAN_REGISTER_CHANNEL" })
	@ApiResponse({
		status: 200,
		description: "Channel Registration",
		type: ""
	})
	@ApiHeaders([
		{ name: "clientCode", description: "Client Code", required: true },
		{ name: "clientPwd", description: "Client Password", required: true }
	])
	channelRegistration(@Body() channelRegisterRequest: ChannelRegistrationRequest) {
		return this.channelMasterService.channelRegistration(channelRegisterRequest);
	}

	@Post("client/updateChannel")
	@ApiOperation({ summary: "CAN_UPDATE_CHANNEL" })
	@ApiResponse({
		status: 200,
		description: "Update Channel",
		type: ""
	})
	@ApiHeaders([
		{ name: "clientCode", description: "Client Code", required: true },
		{ name: "clientPwd", description: "Client Password", required: true }
	])
	async updateChannel(@Body() updateChannelRequest: UpdateChannelRequest) {
		return this.channelMasterService.updateChannel(updateChannelRequest);
	}

	@Post("client/updateConfigurations")
	@ApiOperation({ summary: "CAN_UPDATE_CONFIGURATIONS" })
	@ApiResponse({
		status: 200,
		description: "Update Configurations",
		type: ""
	})
	@ApiHeaders([
		{ name: "clientCode", description: "Client Code", required: true },
		{ name: "clientPwd", description: "Client Password", required: true }
	])
	async updateConfigurations(@Body() updateConfigurationsRequest: UpdateConfigurationsRequest) {
		return this.channelMasterService.updateConfigurations(updateConfigurationsRequest);
	}

	@Get("/v1.0/getConfigurations")
	@ApiOperation({ summary: "Get Configuration API" })
	@ApiResponse({
		status: 200,
		description: "Get Configuration API",
		type: ""
	})
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiQuery({ name: "configType", type: "string", required: true })
	@ApiQuery({ name: "channelId", type: "number", required: true })
	@ApiQuery({ name: "businessId", type: "number", required: true })
	async getConfigurations(
		@Query("configType") configType: string,
		@Query("channelId") channelId: number,
		@Query("businessId") businessId: number,
		@Req() request
	) {
		return this.configurationService.getConfigurations(configType, +channelId, +businessId, request);
	}
}
