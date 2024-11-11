import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({
	name: "sb_crs_plaid_link_tokens"
})
export class PlaidLinkTokens {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	userId: number;

	@Column()
	refdocId: number;

	@Column({ length: 20 })
	paymentType: string;

	@Column({ length: 100 })
	linkToken: string;

	@Column({ length: 255 })
	accessToken: string;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	constructor(userId: number, linkToken: string, accessToken: string, refdocId: number, paymentType: string) {
		this.userId = userId;
		this.linkToken = linkToken;
		this.accessToken = accessToken;
		this.refdocId = refdocId;
		this.paymentType = paymentType;
	}
}
