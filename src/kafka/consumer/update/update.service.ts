import { Injectable } from "@nestjs/common";
import { KafkaRequestDaoService } from "src/modules/dao/kafka-request-dao/kafka-request-dao.service";
import { UserMasterService } from "src/modules/user-master/user-master.service";
import VariablesConstant from "src/utils/variables-constant";

@Injectable()
export class UpdateService {
	constructor(private kafkaRequestDao: KafkaRequestDaoService, private userService: UserMasterService) {}

	async updateUser(message) {
		let kafkaRequest = null;
		try {
			kafkaRequest = await this.kafkaRequestDao.save({
				topic: VariablesConstant.UPDATE,
				request: message,
				status: "IN_PROGRESS",
				retryCount: 0
			});
			const requestData = message;
			await this.userService.updateUser(JSON.parse(requestData));
			kafkaRequest.status = "DONE";
			kafkaRequest.errorResponse = null;
			await this.kafkaRequestDao.save(kafkaRequest);
		} catch (e) {
			kafkaRequest.status = VariablesConstant.ERROR;
			kafkaRequest.errorResponse = e?.response?.status?.errorMessage ? e.response.status.errorMessage : e.message;
			await this.kafkaRequestDao.save(kafkaRequest);
		}
	}
}
