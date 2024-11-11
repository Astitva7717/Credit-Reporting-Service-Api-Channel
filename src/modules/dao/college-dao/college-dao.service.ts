import { CollegeMasterEntity } from "@modules/college/entities/college-master.entity";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ResponseData } from "@utils/enums/response";
import { DataSource, Like } from "typeorm";

@Injectable()
export class CollegeDaoService {
	constructor(private readonly dataSource: DataSource) {}

	async getAllColleges(page: number = 1, limit: number = 20, query: string = '') {
		let offset = (page - 1) * limit;
		let count = await this.dataSource.getRepository(CollegeMasterEntity).count({
            where:{
                name:Like(`%${query}%`)
            }
        });
		let colleges = await this.dataSource.getRepository(CollegeMasterEntity).find({
			skip: offset,
			take: limit,
			where: [
				{
					name: Like(`%${query}%`)
				}
			]
		});
		if (!colleges.length) {
			throw new HttpException({ status: ResponseData.DATA_NOT_FOUND }, HttpStatus.OK);
		}
		return { colleges, total: count };
	}
}
