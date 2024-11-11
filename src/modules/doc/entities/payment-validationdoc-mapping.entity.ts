import { Status } from "@utils/enums/Status";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({
	name: "sb_crs_payment_validation_doc_mapping"
})
export class PaymentValidationdocMapping {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ length: 50 })
	paymentType: string;

	@Column({ length: 50 })
	paymentTypeName: string;

	@Column({ nullable: true, length: 50 })
	masterProofType: string;

	@Column({ nullable: true, length: 50 })
	monthlyProofType: string;

	@Column({ length: 255 })
	imageUrl: string;

	@Column({ nullable: true, type: "enum", enum: Status })
	status: Status;

	@CreateDateColumn({ nullable: true })
	createdAt: Date;

	@UpdateDateColumn({ nullable: true })
	updatedAt: Date;

	constructor(
		paymentType: string,
		masterProofType: string = null,
		monthlyProofType: string = null,
		status: Status = null
	) {
		this.paymentType = paymentType;
		this.masterProofType = masterProofType;
		this.monthlyProofType = monthlyProofType;
		this.status = status;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}
}
