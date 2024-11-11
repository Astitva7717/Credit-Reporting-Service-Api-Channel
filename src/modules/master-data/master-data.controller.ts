import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { MasterDataService } from "./master-data.service";
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthenticationGuard } from "@utils/guards/authentication/authentication-gaurd";
import { RequetsValidationGuard } from "@utils/guards/validation/request-validation.guard";

@UseGuards(AuthenticationGuard, RequetsValidationGuard)
@ApiTags("Master Data Controller")
@Controller("")
export class MasterDataController {
	constructor(private readonly masterDataService: MasterDataService) {}

	@Get(["v1.0/getCountryList", "preLogin/getCountryList"])
	@ApiOperation({ summary: "Fetch All Countries" })
	@ApiResponse({
		status: 200,
		description: "All Countries",
		type: ""
	})
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	async getAllCountries() {
		return this.masterDataService.getAllCountries();
	}

	@Get(["v1.0/getStateList", "preLogin/getStateList"])
	@ApiOperation({ summary: "Fetch All States" })
	@ApiResponse({
		status: 200,
		description: "All States",
		type: ""
	})
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	async getStates(@Query("countryCode") countryCode) {
		return this.masterDataService.getStateByCountryCode(countryCode);
	}

	@Get(["v1.0/getCityList", "preLogin/getCityList"])
	@ApiOperation({ summary: "Fetch All Cities" })
	@ApiResponse({
		status: 200,
		description: "All Cities",
		type: ""
	})
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	async getCities(@Query("stateCode") stateCode) {
		return this.masterDataService.getCityByStateCode(stateCode);
	}
}
