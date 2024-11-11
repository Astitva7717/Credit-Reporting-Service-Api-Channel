import { Module } from "@nestjs/common";
import { DocService } from "./doc.service";
import { DocController } from "./doc.controller";
import { DaoModule } from "../dao/dao.module";
import { UtilsModule } from "src/utils/utils.module";
import { MongoModule } from "../mongo/mongo.module";
import { PlaidModule } from "@modules/plaid/plaid.module";
import { KafkaModule } from "@kafka/kafka.module";
import { DocHelperService } from "./doc-helper/doc-helper.service";
import { AppLoggerModule } from "src/app-logger/app-logger.module";
import { DocSchedularController } from "./schedular/docSchedular-controller";
import { DocSchedularService } from "./schedular/docSchedularService";

@Module({
	imports: [DaoModule, UtilsModule, MongoModule, PlaidModule, KafkaModule, AppLoggerModule],
	controllers: [DocController, DocSchedularController],
	providers: [DocService, DocHelperService, DocSchedularService],
	exports: [DocHelperService]
})
export class DocModule {}
