import { ApiProperty } from "@nestjs/swagger";

export class BlogArticleIdDto {
	@ApiProperty()
	articleId: number;
}
