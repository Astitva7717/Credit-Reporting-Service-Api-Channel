import { Controller, Get, UseGuards, Query } from "@nestjs/common";
import { CollegeService } from "./college.service";
import { ApiHeaders, ApiOperation, ApiTags } from "@nestjs/swagger";
import { GetCollegeListDto } from "./dto/college-list.dto";
import { AuthenticationGuard } from "@utils/guards/authentication/authentication-gaurd";
import { RequetsValidationGuard } from "@utils/guards/validation/request-validation.guard";

@UseGuards(AuthenticationGuard, RequetsValidationGuard)
@ApiTags("College")
@Controller()
export class CollegeController {
	constructor(private readonly collegeService: CollegeService) {}

	@Get("preLogin/college/fetchList")
	@ApiOperation({ summary: "Get ref doc master proof" })
	@ApiHeaders([{ name: "clientCode", description: "Client Code", required: true }])
	fetchList(@Query() getCollegeListDto: GetCollegeListDto) {
		return this.collegeService.fetchList(getCollegeListDto);
	}
}
