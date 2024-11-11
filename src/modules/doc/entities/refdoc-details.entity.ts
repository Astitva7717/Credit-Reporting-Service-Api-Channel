import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity({
    name: "sb_crs_refdoc_details"
})

export class RefdocDetails {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    refdocId: number;

    @Column({length: 255})
    key: string;

    @Column({length: 255})
    value: string;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn({ nullable: true })
	updateAt: Date;

    constructor(
		refdocId: number, 
		key: string,
	    value: string,
	) {
		this.refdocId = refdocId;
        this.key = key;
        this.value = value;
		this.createdAt = new Date();
		this.updateAt = new Date();
	}
}