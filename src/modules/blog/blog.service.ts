import { UserDaoService } from "src/modules/dao/user-dao/user-dao.service";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { BlogDaoService } from "@modules/dao/blog-dao/blog-dao.service";
import { GetBlogArticlesDto } from "./dto/get-blog.dto";
import { BlogArticle } from "./entities/blog.entity";
import { ResponseData } from "@utils/enums/response";
import { CreateBlogDto } from "./dto/create-blog.dto";
import { UpdateBlogDto } from "./dto/update-blog.dto";
import { BlogArticleIdDto } from "./dto/blog-id.dto";
import VariablesConstant from "@utils/variables-constant";
import { ConfigurationService } from "@utils/configuration/configuration.service";
import { ConfigCodeEnum, RequestFromEnum } from "@utils/enums/constants";
import { CommonUtilityService } from "@utils/common/common-utility/common-utility.service";
import { BlogHelperService } from "./blog-helper/blog-helper";
import { CreateCatgoryDto } from "./dto/category.dto";
import { BlogCategory } from "./entities/blog-category.entity";
import { MemoryStorageFile } from "@blazity/nest-file-fastify";
import { BlogUserArticles } from "./entities/blog-user.entity";
import { ChannelDaoService } from "@modules/dao/channel-dao/channel-dao.service";
import { UserType } from "@utils/enums/user-types";
import { DataSource } from "typeorm";

@Injectable()
export class BlogService {
	constructor(
		private readonly blogDaoService: BlogDaoService,
		private readonly userDaoService: UserDaoService,
		private readonly configurationService: ConfigurationService,
		private readonly commonUtilityService: CommonUtilityService,
		private readonly blogHelperService: BlogHelperService,
		private channelDao: ChannelDaoService,
		private readonly dataSource: DataSource
	) {}

	async getBlogCategories() {
		return this.blogDaoService.getBlogCategories();
	}

	async createBlogCategory(createCatgoryDto: CreateCatgoryDto, request: any) {
		const userDetailModel = request[VariablesConstant.USER_DETAIL_MODEL];
		const { categoryName } = createCatgoryDto;
		const categoryExist = await this.blogDaoService.getCategoryByName(categoryName);
		if (categoryExist) {
			throw new HttpException({ data: {}, status: ResponseData.CATEGORY_ALREADY_EXISTS }, HttpStatus.OK);
		}
		const newCategory = new BlogCategory(categoryName, userDetailModel?.userId);
		await this.blogDaoService.createBlogCategory(newCategory);
	}

	async getArticles(getArticlesDto: GetBlogArticlesDto, request: any) {
		const userInfo = request[VariablesConstant.USER_DETAIL_MODEL];
		const channelId = userInfo?.channelId;
		const configs = await this.configurationService.getChannelConfigurations(channelId);
		const dateFormat = configs.get(ConfigCodeEnum.DEFAULT_DATE_FORMAT) || "MM-DD-YYYY";
		return await this.blogHelperService.getArticles(getArticlesDto, dateFormat, RequestFromEnum.APP);
	}

	async getArticlesBackoffice(getArticlesDto: GetBlogArticlesDto, request: any) {
		const userDetailModel = request[VariablesConstant.USER_DETAIL_MODEL];
		const businessId = userDetailModel?.businessId;
		const configs = await this.configurationService.getBusinessConfigurations(businessId);
		const dateFormat = configs.get(ConfigCodeEnum.DEFAULT_DATE_FORMAT) || "MM-DD-YYYY";
		return await this.blogHelperService.getArticles(getArticlesDto, dateFormat, RequestFromEnum.BACKOFFICE);
	}

	async getSingleBlogArticleData(blogArticleIdDto: BlogArticleIdDto, request: any) {
		const { articleId } = blogArticleIdDto;
		const userDetailModel = request[VariablesConstant.USER_DETAIL_MODEL];
		const businessId = userDetailModel?.businessId;
		const configs = await this.configurationService.getBusinessConfigurations(businessId);
		const dateFormat = configs.get(ConfigCodeEnum.DEFAULT_DATE_FORMAT) || "MM-DD-YYYY";
		const article = await this.blogDaoService.getBlogArticleByArticleId(articleId);
		article["blogCreatedAt"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			article["blogCreatedAt"],
			dateFormat
		);
		article["blogUpdatedAt"] = this.commonUtilityService.convertDateFormatIntoDefaultDateFormat(
			article["blogUpdatedAt"],
			dateFormat
		);
		return article;
	}

	async fetchBlog(userArticle: boolean | string, request: any) {
		const userDetailModel = request[VariablesConstant.USER_DETAIL_MODEL];
		const businessId = userDetailModel?.businessId;
		const configs = await this.configurationService.getBusinessConfigurations(businessId);
		const dateFormat = configs.get(ConfigCodeEnum.DEFAULT_DATE_FORMAT) || "MM-DD-YYYY";
		const fetchBlogCount = configs.get(ConfigCodeEnum.FETCH_BLOG_COUNT) || 5;

		let blogArticles;
		const isUserArticle = userArticle === true || userArticle === "true" || userArticle === "1" ;
		if(isUserArticle){
			blogArticles = await this.blogDaoService.fetchArticlesByUser(userDetailModel?.userId , +fetchBlogCount);
		}
		else{
			blogArticles = await this.blogDaoService.fetchArticles(+fetchBlogCount);
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
		return { blogArticles };
	}
	async createBlog(createBlogDto: CreateBlogDto ,request: any) {
		const { heading, blogUrl, userIds, channelId , thumbnail } = createBlogDto;
	
		

		this.validateClient(request);
		this.validateRequiredFields(heading, channelId);
		this.validateThumbnail(thumbnail);
		
		// Initialize variables
		let systemUserIds: number[] = [];
		let userInfoList;
	
		// Fetch channel master details
		const channelMaster = await this.channelDao.findChannelMasterByChannelId(channelId);
	
		// Process and validate userIds if provided
		if (userIds) {
			if (typeof userIds === 'string') {
				try {
					systemUserIds = JSON.parse(userIds).map((id: number) => Number(id));
				} catch (e) {
					throw new HttpException({ status: ResponseData.INVALID_USER_ID_IN_REQUEST }, HttpStatus.BAD_REQUEST);
				}
			} else {
				systemUserIds = userIds.map((id: number) => Number(id));
			}
	
			// Fetch user information
			userInfoList = await this.userDaoService.findByBusinessIdAndChannelIdAndSystemUserIdsAndUserType(
				channelMaster?.businessId,
				channelId,
				systemUserIds,
				UserType.CONSUMER
			);
	
			// Validate that all provided user IDs exist
			if (userInfoList?.length !== systemUserIds?.length) {
				throw new HttpException({ status: ResponseData.INVALID_USER_ID_IN_REQUEST }, HttpStatus.BAD_REQUEST);
			}
		}
	
		// Create blog article instance
		const blogArticle = new BlogArticle(heading, blogUrl,thumbnail, 1);

		// Manage transaction
		const queryRunner = this.dataSource.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
	
			// Save blog article
			const { articleId } = await this.blogDaoService.saveBLogArticle(blogArticle, queryRunner);
	
			// Save user-blog associations if users are provided
			if (userInfoList?.length) {
				const userBlogEntries = userInfoList.map((user) => new BlogUserArticles(user?.userId, articleId, 1));
				await this.blogDaoService.saveUserBlogArticles(userBlogEntries, queryRunner);
			}
	
			// Commit transaction if all operations succeed
			await queryRunner.commitTransaction();
		} catch (error) {
			// Rollback transaction if any operation fails
			await queryRunner.rollbackTransaction();
			throw error;
		} finally {
			// Always release the query runner
			await queryRunner.release();
		}
	}
	
	async updateBlog(updateBlogDto: UpdateBlogDto, request: any) {
		const userDetailModel = request[VariablesConstant.USER_DETAIL_MODEL];
		const { articleId, status } = updateBlogDto;
		const blogArticle = await this.blogDaoService.getBLogArticle(articleId);
		if (status) {
			blogArticle.updateArticleStatus(status);
		}
		blogArticle.updatedByUser(userDetailModel?.userId);
		await this.blogDaoService.updateBLogArticle(blogArticle);
	}


	validateClient(request: any) {
		if (request?.headers?.clientcode !== 'EXTERNAL') {
			throw new HttpException({ status: ResponseData.INVALID_CLIENT }, HttpStatus.BAD_REQUEST);
		}
	}

	validateRequiredFields(heading: string, channelId: number | null) {
		if (!heading || channelId == null) {
			throw new HttpException({ status: ResponseData.INVALID_REQUEST_FORMAT }, HttpStatus.BAD_REQUEST);
		}
	}

	validateThumbnail(thumbnail: string | undefined) {
		if (thumbnail && !this.isImageUrl(thumbnail)) {
			throw new HttpException({ status: ResponseData.INVALID_THUMBNAIL_URL }, HttpStatus.BAD_REQUEST);
		}
	}
	

	isImageUrl (url: string){
		const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
		return imageExtensions.some(ext => url.endsWith(ext));
	};

}
