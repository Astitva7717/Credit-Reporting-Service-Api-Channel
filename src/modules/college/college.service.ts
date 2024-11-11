import { Injectable } from "@nestjs/common";
import { CollegeDaoService } from "@modules/dao/college-dao/college-dao.service";
import { GetCollegeListDto } from "./dto/college-list.dto";

@Injectable()
export class CollegeService {
	constructor(private readonly collegeDaoService: CollegeDaoService) {}

	async fetchList(getCollegeListDto: GetCollegeListDto) {
		let { page, limit, q } = getCollegeListDto;
		return await this.collegeDaoService.getAllColleges(page, limit, q);
	}
}
