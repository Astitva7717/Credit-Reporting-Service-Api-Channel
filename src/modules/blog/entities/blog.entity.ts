import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum BlogArticleStatus {
	DRAFT = "DRAFT",
	PUBLISHED = "PUBLISHED"
}

@Entity({ name: "sb_crs_blog_articles" })
export class BlogArticle {
	@PrimaryGeneratedColumn({ name: "article_id" })
	articleId: number;

	@Column({ length: 255 })
	heading: string;

	@Column({ type: "text" })
	content: string;

	@Column()
	categoryId: number;

	@Column({ enum: BlogArticleStatus, type: "enum" })
	status: BlogArticleStatus;

	@Column({ length: 250 })
	imageUrl: string;

	@Column({ length: 250 })
	blogUrl: string;

	@Column({ type: "bigint" })
	createdBy: number;

	@Column({ type: "bigint" })
	updatedBy: number;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	constructor(heading: string,blogUrl:string,imageUrl:string,createdBy: number) {
		this.heading = heading;
		this.blogUrl = blogUrl;
		this.imageUrl=imageUrl;
		this.createdBy = createdBy;
		this.updatedBy = createdBy;
		this.status = BlogArticleStatus.PUBLISHED;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}

	async updateArticleStatus(status: BlogArticleStatus) {
		this.status = status;
		this.updatedAt = new Date();
	}

	async updateArticleCategory(categoryId: number) {
		this.categoryId = categoryId;
		this.updatedAt = new Date();
	}

	async updateArticleHeading(heading: string) {
		this.heading = heading;
		this.updatedAt = new Date();
	}

	async updateArticleContent(content: string) {
		this.content = content;
		this.updatedAt = new Date();
	}

	async updatedByUser(updatedBy: number) {
		this.updatedBy = updatedBy;
		this.updatedAt = new Date();
	}

	async addBlogImage(imageUrl: string) {
		this.imageUrl = imageUrl;
		this.updatedAt = new Date();
	}
}
