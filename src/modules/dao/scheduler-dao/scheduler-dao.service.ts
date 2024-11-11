import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SchedulerMaster } from "src/modules/doc/entities/scheduler-master.entity";
import { QueryRunner, Repository } from "typeorm";

@Injectable()
export class SchedulerDaoService {
	constructor(
		@InjectRepository(SchedulerMaster)
		private schedulerMasterRepo: Repository<SchedulerMaster>
	) {}

	async findSchedulerDataForUpdate(queryRunner: QueryRunner, schedulerName: string) {
		return await queryRunner.manager
			.getRepository(SchedulerMaster)
			.createQueryBuilder()
			.useTransaction(true)
			.setLock("pessimistic_write")
			.where(`scheduler_name='${schedulerName}'`)
			.andWhere(`status = 1`)
			.getOne();
	}

	async updateSchedulerDBStatus(queryRunner: QueryRunner, status: number, date: Date, schedulerId: number) {
		await queryRunner.manager
			.getRepository(SchedulerMaster)
			.createQueryBuilder()
			.update()
			.set({ runningStatus: status, updatedAt: date })
			.where(`id=${schedulerId}`)
			.execute();
	}

	async findBySchedulerName(requestedSchedulerName: string) {
		return await this.schedulerMasterRepo.findOneBy({
			schedulerName: requestedSchedulerName
		});
	}

	async save(schedulerMaster: SchedulerMaster) {
		return await this.schedulerMasterRepo.save(schedulerMaster);
	}

	async updateRunningStatus(queryRunner: QueryRunner, duration: string) {
		let requestedUpdatedAt = new Date();
		let finalDate =
			requestedUpdatedAt.getFullYear() +
			"-" +
			(requestedUpdatedAt.getMonth() + 1) +
			"-" +
			+requestedUpdatedAt.getDate() +
			" " +
			requestedUpdatedAt.getHours() +
			":" +
			requestedUpdatedAt.getMinutes() +
			":" +
			requestedUpdatedAt.getSeconds();

		await queryRunner.manager
			.getRepository(SchedulerMaster)
			.createQueryBuilder()
			.update()
			.set({ runningStatus: 0, updatedAt: requestedUpdatedAt })
			.where(`running_status=1`)
			.andWhere(`updated_at < DATE_SUB('${finalDate}',INTERVAL '${duration}' MINUTE)`)
			.execute();
	}
}
