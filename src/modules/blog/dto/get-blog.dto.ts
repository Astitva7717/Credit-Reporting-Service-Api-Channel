import { ApiProperty } from "@nestjs/swagger";
import { BlogArticleStatus } from "../entities/blog.entity";
import { PaginationDto } from "@modules/doc/dto/pagination.dto";

export class GetBlogArticlesDto extends PaginationDto {
	@ApiProperty()
	blogStatus: BlogArticleStatus;

	@ApiProperty()
	articleId:number;

	@ApiProperty()
	categoryId:number;

	@ApiProperty()
	createdFrom:Date;

	@ApiProperty()
	createdTo:Date;
}
