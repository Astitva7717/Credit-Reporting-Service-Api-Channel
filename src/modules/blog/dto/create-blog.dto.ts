import { ApiProperty } from "@nestjs/swagger";
import { BlogArticleStatus } from "../entities/blog.entity";

export class CreateBlogDto {
  @ApiProperty()
  heading?: string;

  @ApiProperty()
  blogUrl?: string;

  @ApiProperty()
  thumbnail?: string;
  
  @ApiProperty()
  channelId?: number;

  @ApiProperty({ type: [Number] })
  userIds: number[];

  @ApiProperty()
	status: BlogArticleStatus;
}
