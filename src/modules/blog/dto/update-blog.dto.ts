import { CreateBlogDto } from "./create-blog.dto";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateBlogDto extends CreateBlogDto {
	@ApiProperty()
	articleId: number;
}
