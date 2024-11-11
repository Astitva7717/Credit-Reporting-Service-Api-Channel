import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({
	name: "sb_scheduler_master"
})
export class SchedulerMaster {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ length: 50 })
	schedulerName: string;

	@Column({ length: 250, nullable: true })
	serverIpAllowed: string;

	@Column()
	runningStatus: number;

	@Column()
	status: number;

	@CreateDateColumn({ nullable: true })
	createdAt: Date;

	@UpdateDateColumn({ nullable: true })
	updatedAt: Date;

	constructor(schedulerName: string, serverIpAllowed: string, runningStatus: number, status: number) {
		this.schedulerName = schedulerName;
		this.serverIpAllowed = serverIpAllowed;
		this.runningStatus = runningStatus;
		this.status = status;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}
}
