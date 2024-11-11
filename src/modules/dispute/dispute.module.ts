import { Module } from "@nestjs/common";
import { DisputeService } from "./dispute.service";
import { DisputeController } from "./dispute.controller";
import { DaoModule } from "@modules/dao/dao.module";
import { UtilsModule } from "@utils/utils.module";
import { AppLoggerModule } from "@app-logger/app-logger.module";
import { MongoModule } from "@modules/mongo/mongo.module";
import { DisputeHelperService } from "./dispute-helper/dispute-helper.service";
import { MonthlyProofModule } from "@modules/monthly-proof/monthly-proof.module";
import { KafkaModule } from "@kafka/kafka.module";

@Module({
	imports: [DaoModule, UtilsModule, AppLoggerModule, MongoModule, KafkaModule, MonthlyProofModule],
	controllers: [DisputeController],
	providers: [DisputeService, DisputeHelperService]
})
export class DisputeModule {}
