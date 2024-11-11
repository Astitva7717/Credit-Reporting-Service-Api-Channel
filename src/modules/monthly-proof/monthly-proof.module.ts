import { Module } from "@nestjs/common";
import { MonthlyProofService } from "./monthly-proof.service";
import { MonthlyProofController } from "./monthly-proof.controller";
import { DaoModule } from "@modules/dao/dao.module";
import { UtilsModule } from "@utils/utils.module";
import { MongoModule } from "@modules/mongo/mongo.module";
import { PlaidModule } from "@modules/plaid/plaid.module";
import { MonthlyProofHelperService } from "./monthly-Proof-helper/monthlyProof-helper.service";
import { AppLoggerModule } from "@app-logger/app-logger.module";
import { KafkaModule } from "@kafka/kafka.module";
import { DocModule } from "@modules/doc/doc.module";
import { MonthlyProofSchedularController } from "./schedular/monthlySchedularController";
import { MonthlyProofSchedularService } from "./schedular/monthlyschedularService";

@Module({
	imports: [DaoModule, UtilsModule, MongoModule, PlaidModule, AppLoggerModule, KafkaModule, DocModule],
	controllers: [MonthlyProofController, MonthlyProofSchedularController],
	providers: [MonthlyProofService, MonthlyProofHelperService, MonthlyProofSchedularService],
	exports: [MonthlyProofHelperService]
})
export class MonthlyProofModule {}
