import { Body, Controller, Get, Post, Query, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiHeaders, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { UserMasterService } from "./user-master.service";
import { UserRegistrationRequest } from "./dto/user-registration-request.dto";
import { UpdateUserReq } from "./dto/update-user-request.dto";
import { UserChannelMappingRequest } from "./dto/user-channel-mapping-request.dto";
import postloginDto from "@modules/doc/dto/postlogin.dto";
import { GetUserProfileStatusDto } from "./dto/get-user-profile.dto";
import { UpdateUserProfileStatusDto } from "./dto/update-profile-status.dto";
import { AuthenticationGuard } from "@utils/guards/authentication/authentication-gaurd";
import { RequetsValidationGuard } from "@utils/guards/validation/request-validation.guard";
import { UserSearchinfoDto } from "./dto/user-search-info-dto";
import { GetUserInfo } from "./dto/get-user-info.dto";
import { BackOfficePermissionsDto } from "./dto/back-office-permission-dto";
import { UpdateBackOfficePermissionDto } from "./dto/update-backoffice-permission-dto";
import { UpdateConsumerProfileDto } from "./dto/update-consumer-profile-dto";

@UseGuards(AuthenticationGuard, RequetsValidationGuard)
@ApiTags("User Management")
@Controller("")
export class UserMasterController {
	constructor(private readonly userMasterService: UserMasterService) {}

	//client
	@Post("client/registerUser")
	@ApiOperation({ summary: "CAN REGISTER NEW BACKOFFICE USERS" })
	@ApiHeaders([
		{ name: "clientCode", description: "Client Code", required: true },
		{ name: "clientPwd", description: "Client Password", required: true }
	])
	async registerUser(@Body() userRegistrationRequest: UserRegistrationRequest) {
		return this.userMasterService.registerUser(userRegistrationRequest);
	}

	@Post("client/updateUser")
	@ApiOperation({ summary: "CAN UPDATE BACKOFFICE USERS" })
	@ApiHeaders([
		{ name: "clientCode", description: "Client Code", required: true },
		{ name: "clientPwd", description: "Client Password", required: true }
	])
	async updateUser(@Body() updateUserReq: UpdateUserReq) {
		return this.userMasterService.updateUser(updateUserReq);
	}

	@Post("client/userChannelMapping")
	@ApiHeaders([
		{ name: "clientCode", description: "Client Code", required: true },
		{ name: "clientPwd", description: "Client Password", required: true }
	])
	@ApiOperation({ summary: "CAN MAP USER DOMAIN" })
	async userChannelMapping(@Body() reqBean: UserChannelMappingRequest) {
		return this.userMasterService.userChannelMapping(reqBean);
	}

	//v1.0
	@Get("v1.0/getUserType")
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiOperation({ summary: "CAN GET USER TYPE" })
	@ApiQuery({ name: "businessId", type: "string", required: true })
	async getUserType(@Query("businessId") businessId, @Request() request) {
		return this.userMasterService.getUserTypes(businessId, request);
	}

	@Post("v1.0/getUserSearchInfo")
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiOperation({ summary: "FOR USER SEARCH INFO" })
	async getUserSearchInfo(@Body() body: UserSearchinfoDto, @Request() request) {
		return this.userMasterService.getUserSearchInfo(body, request);
	}

	@Post("v1.0/getBackOfficeUserPermissions")
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiOperation({ summary: "FOR BACKOFFICE USER PERMISSIONS" })
	async getBackOfficeUserPermissions(@Body() body: BackOfficePermissionsDto, @Request() request) {
		return this.userMasterService.getBackOfficeUserPermissions(body);
	}

	@Post("v1.0/updateBackOfficeUserPermissions")
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiOperation({ summary: "FOR UPDATING BACKOFFICE USER PERMISSIONS" })
	async updateBackOfficeUserPermissions(@Body() body: UpdateBackOfficePermissionDto, @Request() request) {
		return this.userMasterService.updateBackOfficeUserPermissions(body, request);
	}

	@Get("v1.0/getUserInfo")
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiOperation({ summary: "GET USER REFDOC INFO" })
	async getUserInfo(@Query() body: GetUserInfo, @Request() request) {
		return this.userMasterService.getUserInfo(body, request);
	}

	//postLogin
	@Get("postLogin/getUserProfileStatus")
	@ApiOperation({ summary: "Get user profile status." })
	@ApiHeaders(postloginDto)
	async getUserProfileStatus(@Query() getUserProfileStatusDto: GetUserProfileStatusDto, @Request() request) {
		return this.userMasterService.getUserProfileStatus(getUserProfileStatusDto, request);
	}

	@Post("postLogin/updateProfileStatus")
	@ApiOperation({ summary: "Update user profile status." })
	@ApiHeaders(postloginDto)
	async updateProfileStatusCode(@Body() updateUserProfileStatusDto: UpdateUserProfileStatusDto, @Request() request) {
		return this.userMasterService.updateUserProfileStatusCode(updateUserProfileStatusDto, request);
	}

	@Get("postLogin/getUserStatus")
	@ApiOperation({ summary: "Get user profile status." })
	@ApiHeaders(postloginDto)
	async getUserStatus(@Request() request) {
		return this.userMasterService.getUserStatus(request);
	}

	@Post("v1.0/updateConsumerProfile")
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiOperation({ summary: "FOR UPDATING CONSUMER PROFILE" })
	async updateConsumerProfile(@Body() updateConsumerProfileDto: UpdateConsumerProfileDto) {
		return this.userMasterService.updateConsumerProfile(updateConsumerProfileDto);
	}
}
