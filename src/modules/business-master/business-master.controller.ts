import { Controller, Get, Post, Body, UseGuards, Request } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiHeaders, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { BusinessMasterService } from "./business-master.service";
import { BusinessRegistrationRequest } from "./dto/create-business-master.dto";
import { AuthenticationGuard } from "@utils/guards/authentication/authentication-gaurd";
import { RequetsValidationGuard } from "@utils/guards/validation/request-validation.guard";

@UseGuards(AuthenticationGuard, RequetsValidationGuard)
@ApiTags("Business Management")
@Controller("/")
export class BusinessMasterController {
	constructor(private readonly businessMasterService: BusinessMasterService) {}

	@Get("v1.0/getBusinessList")
	@ApiOperation({ summary: "CAN GET BUSINESS LIST" })
	@ApiResponse({
		status: 200,
		description: "BusinessList",
		type: ""
	})
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	getBusinessList(@Request() request) {
		return this.businessMasterService.getBusinessList(request);
	}

	@Post("client/businessRegistration")
	@ApiOperation({ summary: "CAN Register BUSINESS" })
	@ApiResponse({
		status: 200,
		description: "Business Registration",
		type: ""
	})
	@ApiHeaders([
		{ name: "clientCode", description: "Client Code", required: true },
		{ name: "clientPwd", description: "Client Password", required: true }
	])
	businessRegistration(@Body() createBusinessMasterDto: BusinessRegistrationRequest) {
		return this.businessMasterService.businessRegistration(createBusinessMasterDto);
	}

	@Post("client/updateBusinessDetails")
	@ApiOperation({ summary: "CAN Update Business Details" })
	@ApiResponse({
		status: 200,
		description: "Business Update",
		type: ""
	})
	@ApiHeaders([
		{ name: "clientCode", description: "Client Code", required: true },
		{ name: "clientPwd", description: "Client Password", required: true }
	])
	updateBusinessDetails(@Body() updateBusinessRequest: BusinessRegistrationRequest) {
		return this.businessMasterService.updateBusinessDetails(updateBusinessRequest);
	}
}
