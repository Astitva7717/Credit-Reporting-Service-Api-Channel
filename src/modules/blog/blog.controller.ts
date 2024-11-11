import { Body, Controller, Get, Post, Query, Request, UseGuards, UseInterceptors } from "@nestjs/common";
import { BlogService } from "./blog.service";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiHeader, ApiHeaders, ApiOperation, ApiTags } from "@nestjs/swagger";
import { GetBlogArticlesDto } from "./dto/get-blog.dto";
import { CreateBlogDto } from "./dto/create-blog.dto";
import { UpdateBlogDto } from "./dto/update-blog.dto";
import { AuthenticationGuard } from "@utils/guards/authentication/authentication-gaurd";
import { RequetsValidationGuard } from "@utils/guards/validation/request-validation.guard";
import { CreateCatgoryDto } from "./dto/category.dto";
import { FileInterceptor, UploadedFile, MemoryStorageFile } from "@blazity/nest-file-fastify";
import { BlogArticleIdDto } from "./dto/blog-id.dto";

@UseGuards(AuthenticationGuard, RequetsValidationGuard)
@ApiTags("Blog Management")
@Controller("")
export class BlogController {
	constructor(private readonly blogService: BlogService) {}

	//postLogin
	@Get(["postLogin/blog/categories", "v1.0/blog/categories"])
	@ApiOperation({ summary: "Fetch Categories." })
	@ApiHeaders([{ name: "clientCode", description: "Client Code", required: true }])
	fetchList() {
		return this.blogService.getBlogCategories();
	}

	@Get("postLogin/blog/articles")
	@ApiOperation({ summary: "Fetch Articles." })
	@ApiHeaders([{ name: "clientCode", description: "Client Code", required: true }])
	getArticles(@Query() getArticlesDto: GetBlogArticlesDto, @Request() request) {
		return this.blogService.getArticles(getArticlesDto, request);
	}


	@Get("postLogin/blog/getBlog")
	@ApiOperation({ summary: "Fetch Articles." })
	fetchBlog(@Query("userArticle") userArticle: boolean, @Request() request) {
		 return this.blogService.fetchBlog(userArticle, request);
	}

	//v1.0
	@Get("v1.0/blog/getArticles")
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiOperation({ summary: "Fetch articles from backOffice" })
	getArticlesBackoffice(@Query() getArticlesDto: GetBlogArticlesDto, @Request() request) {
		return this.blogService.getArticlesBackoffice(getArticlesDto, request);
	}

	@Get("v1.0/blog/getArticle")
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiOperation({ summary: "Fecth single blog article data" })
	getSingleBlogArticleData(@Query() blogArticleIdDto: BlogArticleIdDto, @Request() request) {
		return this.blogService.getSingleBlogArticleData(blogArticleIdDto, request);
	}

	@Post("v1.0/blog/updateBlog")
	@ApiOperation({ summary: "Update blog article." })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiBody({
		schema: {
			type: "object",
			properties: {
				blogStatus: { type: "string" },
				articleId: { type: "integer" }
			}
		}
	})
	updateBlogArticle( @Body() updateBlogDto: UpdateBlogDto, @Request() request) {
		return this.blogService.updateBlog( updateBlogDto, request);
	}

	@Post("v1.0/blog/createCategory")
	@ApiOperation({ summary: "Add new blog category." })
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	createBlogCategory(@Body() createCatgoryDto: CreateCatgoryDto, @Request() request) {
		return this.blogService.createBlogCategory(createCatgoryDto, request);
	}
	
	//client
	@Post("client/createBlog")
	@ApiOperation({ summary: "Create blog article." })
	@ApiHeaders([
		{ name: "clientCode", description: "Client Code", required: true },
		{ name: "clientPwd", description: "Client Password", required: true }
	])
	@ApiBody({
		schema: {
		  type: "object",
		  properties: {
			heading: { type: "string" },
			blogUrl: { type: "string" },
			thumbnail: { type: "string" },
			userIds: { type: "string" },
			channelId: { type: "number" },
		  }
		  
		}
	  })
	createBlog( @Body() createBlogDto: CreateBlogDto ,@Request() request) {
		return this.blogService.createBlog(createBlogDto ,request);
	}

}
