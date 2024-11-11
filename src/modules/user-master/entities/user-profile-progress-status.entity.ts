import { UserProfileStatusEnum } from "@utils/enums/Status";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity({
	name: "sb_crs_user_profile_progress"
})
export class UserProfileProgress {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ nullable: true })
	userId: number;

	@Column({ nullable: true })
	refdocId: number;

	@Column({ type: "enum", enum: UserProfileStatusEnum })
	profileStageCode: UserProfileStatusEnum;

	@Column({ type: "text", nullable: true })
	data: string;

	@CreateDateColumn({ name: "created_at", type: "datetime" })
	createdAt: Date;

	@UpdateDateColumn({ name: "updated_at", type: "datetime", onUpdate: "CURRENT_TIMESTAMP" })
	updatedAt: Date;

	constructor(userId: number, profileStageCode: UserProfileStatusEnum, data: string,refdocId:number) {
		this.userId = userId;
		this.profileStageCode = profileStageCode;
		this.data = data;
		this.refdocId = refdocId;
	}
}
