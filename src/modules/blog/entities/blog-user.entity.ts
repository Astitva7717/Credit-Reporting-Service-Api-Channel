import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum BlogUserStatusEnum {
	ACTIVE = "ACTIVE",
	INACTIVE = "INACTIVE"
}

@Entity({ name: "sb_crs_user_blog_articles" })
export class BlogUserArticles {
	@PrimaryGeneratedColumn()
	id: number;

    @Column()
	article_id: number;

    @Column()
	user_id: number;
    
	@Column({ enum: BlogUserStatusEnum, type: "enum" })
	status: BlogUserStatusEnum;

	@Column({ type: "bigint" })
	createdBy: number;

	@Column({ type: "bigint" })
	updatedBy: number;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	constructor(user_id:number ,article_id: number, createdBy: number) {
		this.user_id = user_id;
		this.article_id = article_id;
		this.createdBy = createdBy;
		this.updatedBy = createdBy;
		this.status = BlogUserStatusEnum.ACTIVE;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}
}
