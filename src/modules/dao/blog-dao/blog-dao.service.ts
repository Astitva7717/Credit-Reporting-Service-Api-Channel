import { GetBlogArticlesDto } from "@modules/blog/dto/get-blog.dto";

import { BlogCategory, BlogCategoryStatusEnum } from "@modules/blog/entities/blog-category.entity";
import { BlogUserArticles, BlogUserStatusEnum } from "@modules/blog/entities/blog-user.entity";
import { BlogArticle, BlogArticleStatus } from "@modules/blog/entities/blog.entity";
import { StatusMasterEntity } from "@modules/doc/entities/status-master.entity";
import { UserMasterEntity } from "@modules/user-master/entities/user-master.entity";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { GetArticles, GetArticlesForBackoffice, getBlogArticleByArticleId ,fetchArticles } from "@utils/constants/querry-constants";
import { ResponseData } from "@utils/enums/response";
import { DataSource, QueryRunner } from "typeorm";

@Injectable()
export class BlogDaoService {
	constructor(private readonly dataSource: DataSource) {}

	async saveBLogArticle(blogArticle: BlogArticle , queryRunner: QueryRunner) {
		return await queryRunner.manager.getRepository(BlogArticle).save(blogArticle);
	}

	async updateBLogArticle(blogArticle: BlogArticle) {
		return await this.dataSource.getRepository(BlogArticle).save(blogArticle);
	}

	async createBlogCategory(blogCategory: BlogCategory) {
		return await this.dataSource.getRepository(BlogCategory).save(blogCategory);
	}

	async getBLogArticle(articleId: number) {
		const blogArticle = await this.dataSource.getRepository(BlogArticle).findOne({
			where: {
				articleId
			}
		});
		if (!blogArticle) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return blogArticle;
	}

	async getBlogCategories() {
		const blogCategories = await this.dataSource.getRepository(BlogCategory).find({
			where: {
				status: BlogCategoryStatusEnum.ACTIVE
			}
		});
		if (!blogCategories.length) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return blogCategories;
	}

	async getCategoryByName(name: string) {
		return await this.dataSource.getRepository(BlogCategory).findOne({
			where: {
				name,
				status: BlogCategoryStatusEnum.ACTIVE
			}
		});
	}

	async getBlogCategoryById(categoryId: number) {
		const category = await this.dataSource.getRepository(BlogCategory).findOne({
			where: {
				categoryId,
				status: BlogCategoryStatusEnum.ACTIVE
			}
		});
		if (!category) {
			throw new HttpException({ status: ResponseData.INVALID_BLOG_CATEGORY_ID }, HttpStatus.OK);
		}
		return category;
	}

	async getArticlesForBackoffice(getArticlesDto: GetBlogArticlesDto, createdFrom: string, createdTo: string) {
		let { page, limit, blogStatus, articleId, categoryId } = getArticlesDto;

		if (!page) {
			page = 1;
		}
		if (!limit) {
			limit = 20;
		}
		const offset = (page - 1) * limit;

		let queryBuilder = this.dataSource
			.getRepository(BlogArticle)
			.createQueryBuilder("blogArticle")
			.innerJoin(BlogCategory, "blogCategory", "blogArticle.categoryId = blogCategory.categoryId")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = blogArticle.status")
			.innerJoin(UserMasterEntity, "createrUserInfo", "createrUserInfo.userId = blogArticle.createdBy")
			.innerJoin(UserMasterEntity, "updateByUserInfo", "updateByUserInfo.userId = blogArticle.updatedBy")
			.select(GetArticlesForBackoffice)
			.where(`blogCategory.status = '${BlogCategoryStatusEnum.ACTIVE}'`)
			.andWhere(`(:categoryId IS NULL OR blogCategory.categoryId = :categoryId)`, { categoryId })
			.andWhere(`(:articleId IS NULL OR blogArticle.articleId = :articleId)`, { articleId })
			.andWhere(`(:blogStatus IS NULL OR blogArticle.status = :blogStatus)`, { blogStatus })
			.andWhere(`(:createdFrom IS NULL OR blogArticle.createdAt >= :createdFrom)`, { createdFrom })
			.andWhere(`(:createdTo IS NULL OR blogArticle.createdAt <= :createdTo)`, { createdTo });

		const total = await queryBuilder.getCount();
		const blogArticles = await queryBuilder
			.offset(offset)
			.limit(limit)
			.orderBy("blogArticle.createdAt", "DESC")
			.getRawMany();

		if (!blogArticles.length) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}

		return { total, blogArticles };
	}

	async getArticles(getArticlesDto: GetBlogArticlesDto) {
		let { page, limit } = getArticlesDto;

		if (!page) {
			page = 1;
		}
		if (!limit) {
			limit = 20;
		}
		const offset = (page - 1) * limit;

		let queryBuilder = this.dataSource
			.getRepository(BlogArticle)
			.createQueryBuilder("blogArticle")
			.innerJoin(BlogCategory, "blogCategory", "blogArticle.categoryId = blogCategory.categoryId")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = blogArticle.status")
			.select(GetArticles)
			.where(`blogCategory.status = '${BlogCategoryStatusEnum.ACTIVE}'`)
			.andWhere(`blogArticle.status = :blogStatus`, { blogStatus: BlogArticleStatus.PUBLISHED });

		const total = await queryBuilder.getCount();
		const blogArticles = await queryBuilder
			.offset(offset)
			.limit(limit)
			.orderBy("blogArticle.createdAt", "DESC")
			.getRawMany();

		if (!blogArticles.length) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}

		return { total, blogArticles };
	}

	async getBlogArticleByArticleId(articleId: number) {
		const article = await this.dataSource
			.getRepository(BlogArticle)
			.createQueryBuilder("blogArticle")
			.innerJoin(BlogCategory, "blogCategory", "blogArticle.categoryId = blogCategory.categoryId")
			.innerJoin(StatusMasterEntity, "statusMaster", "statusMaster.status = blogArticle.status")
			.innerJoin(UserMasterEntity, "createrUserInfo", "createrUserInfo.userId = blogArticle.createdBy")
			.innerJoin(UserMasterEntity, "updateByUserInfo", "updateByUserInfo.userId = blogArticle.updatedBy")
			.select(getBlogArticleByArticleId)
			.where(`blogCategory.status = '${BlogCategoryStatusEnum.ACTIVE}'`)
			.andWhere("blogArticle.articleId = :articleId", { articleId })
			.getRawOne();
		if (!article) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return article;
	}
	

	async fetchArticlesByUser(userId:number, limit: number) {
	
		// Fetch articles for the specific user
		let blogArticles = await this.dataSource
			.getRepository(BlogUserArticles)
			.createQueryBuilder("blogUserArticles")
			.innerJoin(BlogArticle, "blogArticle", "blogUserArticles.article_id = blogArticle.articleId")
			.select(fetchArticles)
			.where("blogUserArticles.user_id = :userId", { userId })
			.andWhere("blogUserArticles.status = :blogUserStatus", { blogUserStatus: BlogUserStatusEnum.ACTIVE })
			.andWhere("blogArticle.status = :blogStatus", { blogStatus: BlogArticleStatus.PUBLISHED })
			.orderBy("blogArticle.createdAt", "DESC")
			.limit(limit)
			.getRawMany();
	
		const articlesCount = blogArticles.length;
	
		// If the number of articles is less than the limit, fetch more articles excluding the already fetched ones
		if (articlesCount < limit) {
			const remainingLimit = limit - articlesCount;
			const excludedArticleIds = blogArticles.map(article => Number(article.articleId));
	
			let additionalArticles: any[] = [];
	
			if (excludedArticleIds.length > 0) {
				additionalArticles = await this.dataSource
					.getRepository(BlogArticle)
					.createQueryBuilder("blogArticle")
					.select(fetchArticles)
					.where("blogArticle.article_id NOT IN (:...excludedArticleIds)", { excludedArticleIds })
					.andWhere("blogArticle.status = :blogStatus", { blogStatus: BlogArticleStatus.PUBLISHED })
					.orderBy("blogArticle.createdAt", "DESC")
					.limit(remainingLimit)
					.getRawMany();
			} else {
				additionalArticles = await this.dataSource
					.getRepository(BlogArticle)
					.createQueryBuilder("blogArticle")
					.select(fetchArticles)
					.where("blogArticle.status = :blogStatus", { blogStatus: BlogArticleStatus.PUBLISHED })
					.orderBy("blogArticle.createdAt", "DESC")
					.limit(remainingLimit)
					.getRawMany();
			}
	
			blogArticles = [...blogArticles, ...additionalArticles];
		}
	
		if (!blogArticles.length) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
	
		return blogArticles;
	}
	


	async fetchArticles(limit:number) {
		let queryBuilder = this.dataSource
			.getRepository(BlogArticle)
			.createQueryBuilder("blogArticle")
			.select(fetchArticles)
			.where(`blogArticle.status = :blogStatus`, { blogStatus: BlogArticleStatus.PUBLISHED });

		const blogArticles = await queryBuilder
			.limit(limit)
			.orderBy("blogArticle.createdAt", "DESC")
			.getRawMany();

		if (!blogArticles.length) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return blogArticles;
	}
	

	async saveUserBlogArticles(userBlogEntries: BlogUserArticles[] , queryRunner: QueryRunner) {
		return await queryRunner.manager.getRepository(BlogUserArticles).save(userBlogEntries);
	}
	

	
}
