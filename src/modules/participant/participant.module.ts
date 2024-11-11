import { Module } from "@nestjs/common";
import { ParticipantService } from "./participant.service";
import { ParticipantController } from "./participant.controller";
import { UtilsModule } from "@utils/utils.module";
import { DaoModule } from "@modules/dao/dao.module";
import { MongoModule } from "@modules/mongo/mongo.module";
import { AppLoggerModule } from "src/app-logger/app-logger.module";
import { KafkaModule } from "@kafka/kafka.module";

@Module({
	imports: [UtilsModule, DaoModule, MongoModule, AppLoggerModule, KafkaModule],
	controllers: [ParticipantController],
	providers: [ParticipantService],
	exports: [ParticipantService]
})
export class ParticipantModule {}
