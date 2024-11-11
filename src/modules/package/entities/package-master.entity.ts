import { Status, YesNoEnum } from "@utils/enums/Status";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({
	name: "sb_crs_package_master"
})
export class PackageMaster {
	@PrimaryGeneratedColumn()
	packageId: number;

	@Column({ length: 100 })
	name: string;

	@Column({ type: "text", nullable: true })
	description: string;

	@Column({ length: 50 })
	code: string;

	@Column({ type: "enum", enum: YesNoEnum })
	autoRenew?: YesNoEnum;

	@Column()
	refdocTypeId: number;

	@Column({ type: "decimal", precision: 10, scale: 4 })
	firstUnitPrice: number;

	@Column({ type: "decimal", precision: 10, scale: 4 })
	otherUnitPrice: number;

	@Column({ type: "decimal", precision: 10, scale: 4 })
	firstUnitPriceStudent: number;

	@Column({ type: "decimal", precision: 10, scale: 4 })
	otherUnitPriceStudent: number;

	@Column({ type: "enum", enum: Status })
	status?: Status;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	constructor(
		code: string,
		firstUnitPrice: number,
		otherUnitPrice: number,
		firstUnitPriceStudent: number,
		otherUnitPriceStudent: number,
		status: Status,
		refdocTypeId: number
	) {
		this.code = code;
		this.firstUnitPrice = firstUnitPrice;
		this.otherUnitPrice = otherUnitPrice;
		this.firstUnitPriceStudent = firstUnitPriceStudent;
		this.otherUnitPriceStudent = otherUnitPriceStudent;
		this.status = status;
		this.createdAt = new Date();
		this.updatedAt = new Date();
		this.refdocTypeId = refdocTypeId;
	}

	addPackageDetails(name: string, description: string = null) {
		this.name = name;
		this.description = description;
	}

	updateAutoRenew(autoRenew: YesNoEnum) {
		this.autoRenew = autoRenew;
	}
}
