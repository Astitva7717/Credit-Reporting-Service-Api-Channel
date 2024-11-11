import { Logger, Module } from "@nestjs/common";
import * as rotateFile from "winston-daily-rotate-file";
import { ConfigModule } from "./config/config.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "./database/database.module";
import { WinstonModule } from "nest-winston";
import * as winston from "winston";
import { join } from "path";
import { UserMasterModule } from "./modules/user-master/user-master.module";
import { HttpModule } from "@nestjs/axios";
import { MasterDataModule } from "./modules/master-data/master-data.module";
import { DaoModule } from "./modules/dao/dao.module";
import { UtilsModule } from "./utils/utils.module";
import { MongoModule } from "./modules/mongo/mongo.module";
import { Subject } from "rxjs";
import { CommonUtilityService } from "./utils/common/common-utility/common-utility.service";
import { PlaidModule } from "./modules/plaid/plaid.module";
import { BackOfficeMasterModule } from "./modules/back-office-master/back-office-master.module";
import { DocModule } from "./modules/doc/doc.module";
import { ConfigService } from "./config/config.service";
import { KafkaModule } from "./kafka/kafka.module";
import { PackageModule } from "@modules/package/package.module";
import { ParticipantModule } from "@modules/participant/participant.module";
import { ChannelMasterModule } from "@modules/channel-master/channel-master.module";
import { BusinessMasterModule } from "@modules/business-master/business-master.module";
import { AliasMasterModule } from "@modules/alias-master/alias-master.module";
const { combine, splat, timestamp, printf } = winston.format;
import { ScheduleModule } from "@nestjs/schedule";
import { CollegeModule } from "@modules/college/college.module";
import { MonthlyProofModule } from "@modules/monthly-proof/monthly-proof.module";
import { BlogModule } from "@modules/blog/blog.module";
import { RedisConfigModule } from "./redis/redis.module";
import { DisputeModule } from "@modules/dispute/dispute.module";
import { DashboardModule } from "@modules/dashboard/dashboard.module.ts";
import { ReportingModule } from "@modules/reporting/reporting.module";

const NFTLogFormat = printf(
	({ level, message, timestamp, ...metadata }) =>
		`[CRYR-API-CHANNEL] [${process.pid}] ${CommonUtilityService.getModifiedDate(new Date())} [${level}] - ${message}\n`
);

@Module({
	imports: [
		ScheduleModule.forRoot(),
		WinstonModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				return configService.isEnv("dev")
					? {
							level: "debug",
							format: winston.format.json(),
							defaultMeta: { service: "user-service" },
							transports: [
								new winston.transports.File({
									filename: "logs/debug.log",
									level: "debug"
								}),
								new winston.transports.Console({
									format: winston.format.simple()
								})
							]
					  }
					: {
							level: "info",
							format: combine(winston.format.colorize(), splat(), timestamp(), NFTLogFormat),
							defaultMeta: { service: "user-service" },
							transports: [
								new winston.transports.File({
									filename: "logs/error.log",
									level: "error"
								}),
								new winston.transports.Console({
									format: winston.format.simple()
								}),
								new rotateFile({
									filename: "app_log_%DATE%.log",
									dirname: join("./log/"),
									datePattern: "YYYY-MM-DD",
									zippedArchive: true,
									maxSize: "250m",
									maxFiles: "14d",
									level: "info"
								})
							]
					  };
			}
		}),

		ConfigModule,
		RedisConfigModule,
		KafkaModule,
		DatabaseModule,
		HttpModule,
		UserMasterModule,
		DaoModule,
		MasterDataModule,
		UtilsModule,
		MongoModule,
		PlaidModule,
		BackOfficeMasterModule,
		DocModule,
		PackageModule,
		ParticipantModule,
		ChannelMasterModule,
		BusinessMasterModule,
		AliasMasterModule,
		CollegeModule,
		MonthlyProofModule,
		BlogModule,
		DisputeModule,
		DashboardModule,
		ReportingModule
	],
	controllers: [AppController],
	providers: [AppService]
})
export class AppModule {
	private readonly logger = new Logger(AppModule.name);
	private readonly shutdownListener$: Subject<void> = new Subject();
}
