import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum BlogCategoryStatusEnum {
	ACTIVE = "ACTIVE",
	INACTIVE = "INACTIVE"
}

@Entity({ name: "sb_crs_blog_categories" })
export class BlogCategory {
	@PrimaryGeneratedColumn()
	categoryId: number;

	@Column({ length: 50 })
	name: string;

	@Column({ enum: BlogCategoryStatusEnum, type: "enum" })
	status: BlogCategoryStatusEnum;

	@Column({ type: "bigint" })
	createdBy: number;

	@Column({ type: "bigint" })
	updatedBy: number;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	constructor(name: string, createdBy: number) {
		this.name = name;
		this.createdBy = createdBy;
		this.updatedBy = createdBy;
		this.status = BlogCategoryStatusEnum.ACTIVE;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}
}
