import { CommonUtilityService } from "@utils/common/common-utility/common-utility.service";
import { GetBlogArticlesDto } from "../dto/get-blog.dto";
import { BlogDaoService } from "@modules/dao/blog-dao/blog-dao.service";
import { Injectable } from "@nestjs/common";
import { RequestFromEnum } from "@utils/enums/constants";

@Injectable()
export class BlogHelperService {
	constructor(
		private readonly commonUtilityService: CommonUtilityService,
		private readonly blogDaoService: BlogDaoService
	) {}

	async getArticles(getArticlesDto: GetBlogArticlesDto, dateFormat: string, requestFrom: RequestFromEnum) {
		let total, blogArticles;
		let { createdFrom, createdTo } = getArticlesDto;
		let newCreatedFrom, newCreatedTo;
		if (createdFrom) {
			createdFrom = new Date(createdFrom);
			createdFrom.setSeconds(0);
			createdFrom.setMinutes(0);
			createdFrom.setHours(0);
			newCreatedFrom = CommonUtilityService.getModifiedDate(createdFrom);
		}
		if (createdTo) {
			createdTo = new Date(createdTo);
			createdTo.setSeconds(59);
			createdTo.setMinutes(59);
			createdTo.setHours(23);
			newCreatedTo = CommonUtilityService.getModifiedDate(createdTo);
		}
		if (requestFrom === RequestFromEnum.BACKOFFICE) {
			const response = await this.blogDaoService.getArticlesForBackoffice(
				getArticlesDto,
				newCreatedFrom,
				newCreatedTo
			);
			total = response.total;
			blogArticles = response.blogArticles;
		} else {
			const response = await this.blogDaoService.getArticles(getArticlesDto);
			total = response.total;
			blogArticles = response.blogArticles;
		}
		blogArticles.forEach((article) => {
			article["blogCreatedAt"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				article["blogCreatedAt"],
				dateFormat
			);
			article["blogUpdatedAt"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
				article["blogUpdatedAt"],
				dateFormat
			);
		});
		return { total, blogArticles };
	}
}
