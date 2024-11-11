import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CityMasterEntity } from "@modules/master-data/entities/city-master-entity";
import { ClientTokensEntity } from "@modules/master-data/entities/client-token.entity";
import { CountryMasterEntity } from "@modules/master-data/entities/country-master-entity";
import { StateMasterEntity } from "@modules/master-data/entities/state-master-entity";
import { UserChannelMapping } from "@modules/user-master/entities/user-channel-mapping.entity";
import { UserMasterEntity } from "@modules/user-master/entities/user-master.entity";
import { CommonMongoEntity } from "@modules/mongo/entities/CommonMongoEntity";
import { BusinessMaster } from "@modules/business-master/entities/business-master.entity";
import { BusinessConfigurationMaster } from "@modules/business-master/entities/business-configuration-master-entity";
import { PlaidLinkTokens } from "@modules/plaid/entities/plaid-link-tokens.entity";
import { RefdocMaster } from "@modules/doc/entities/refdoc-master.entity";
import { RefdocParticipantsMaster } from "@modules/doc/entities/refdoc-participants-master.entity";
import { RefdocTypeMaster } from "@modules/doc/entities/refdoc-type-master.entity";
import { ValidationDocMasterProof } from "@modules/doc/entities/validation-doc-master-proof.entity";
import { ValidationDocMonthlyProof } from "@modules/monthly-proof/entities/validation-doc-monthly-proof.entity";
import { PaymentValidationdocMapping } from "@modules/doc/entities/payment-validationdoc-mapping.entity";
import { UserCreditReportingDisputes } from "@modules/doc/entities/user-credit-reporting-disputes.entity";
import { LanguageMaster } from "@modules/doc/entities/language-master.entity";
import { ValidationSchema } from "@modules/doc/entities/validation-schema.entity";
import { SchedulerMaster } from "@modules/doc/entities/scheduler-master.entity";

import { KafkaRequest } from "@kafka/entity/kafka-request.entity";

import { ValidationBean } from "@utils/common-entities/validation-schema-entity";

import { SnakeNamingStrategy } from "./sname-naming-strategy";
import { PackageMaster } from "@modules/package/entities/package-master.entity";
import { UserSubscriptionTransactions } from "@modules/package/entities/user-subscription-txn.entity";
import { ParticipantMapRequest } from "@modules/participant/entities/participant-map-request.entity";
import { PaymentUsersMappingRequest } from "@modules/participant/entities/payment-user-mapping-request.entity";
import { MongoCashierApisEntity } from "@modules/mongo/entities/MongoCashierApisEntity";
import { UserProfileProgress } from "@modules/user-master/entities/user-profile-progress-status.entity";
import { CollegeMasterEntity } from "@modules/college/entities/college-master.entity";
import { RefdocRejectionReasonMaster } from "@modules/doc/entities/refdoc-rejection-reason-master.entity";
import { RefdocDetails } from "@modules/doc/entities/refdoc-details.entity";
import { RefdocDetailsHistoryEntity } from "@modules/doc/entities/refdoc-details-history.entity";
import { RefdocHistory } from "@modules/doc/entities/refdoc-history.entity";
import { PaymentSchedule } from "@modules/doc/entities/payment-schedule.entity";
import { BlogArticle } from "@modules/blog/entities/blog.entity";
import { BlogCategory } from "@modules/blog/entities/blog-category.entity";
import { DisputeEntity } from "@modules/dispute/entities/dispute.entity";
import { DisputeHistoryEntity } from "@modules/dispute/entities/dispute-history.entity";
import { DisputeTypeMaster } from "@modules/dispute/entities/dispute-type-master.entity";
import { StatusMasterEntity } from "@modules/doc/entities/status-master.entity";
import { RefdocUsersEntity } from "@modules/doc/entities/refdoc-users.entity";
import { PiiDataPermissions } from "@modules/user-master/entities/pii-data-permissions.entity";
import { UserPaymentSchedule } from "@modules/doc/entities/user-payment-schedule.entity";
import { UserCreditReportingRequests } from "@modules/reporting/entities/user-credit-reporting-request.entity";
import { MongoBackofficeApis } from "@modules/mongo/entities/MongoBackofficeApis";
import { MonthlyVerifiedProofsEntity } from "@modules/monthly-proof/entities/monthly-proof-verified.entity";
import { NotSignedOption } from "@modules/doc/entities/not-signed-options.entity";
import { MoneyOrderSource } from "@modules/doc/entities/money-order-sources.entity";
import { LeaseFormats } from "@modules/doc/entities/lease-formats.entity";
import { MongoPlaidData } from "@modules/mongo/entities/mongoPlaidDataEntity";
import { DashboardWeeklyData } from "@modules/mongo/entities/dashboardWeeklyDataEntity";
import { DashboardMonthlyData } from "@modules/mongo/entities/dashboardMonthlyDataEntity";
import { DashboardEightWeeksData } from "@modules/mongo/entities/dashboardEightWeeksDataEntity";
import { NonCreditorList } from "@modules/monthly-proof/entities/non-creditor-list.entity";
import { DropdownOption } from "@modules/doc/entities/dropdown-options.entity";
import { BlogUserArticles } from "@modules/blog/entities/blog-user.entity";
import { LeaseSpecificNonCreditorList } from "@modules/monthly-proof/entities/lease-specific-non-creditor-list.entity";
import { CreditorUpdatesAsync } from "@modules/monthly-proof/entities/creditor-updates-async.entity";
@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				name: "default",
				type: "mysql",
				host: configService.get("DB_HOST"),
				port: +configService.get("DB_PORT"),
				username: configService.get("DB_USERNAME"),
				password: configService.get("DB_PASSWORD"),
				database: configService.get("DB_DATABASE"),
				extra: { connectionLimit: 100 },
				poolSize: 100,
				retryAttempts: 5,
				retryDelay: 50000,
				autoLoadEntities: true,
				entities: [
					UserMasterEntity,
					ClientTokensEntity,
					CountryMasterEntity,
					StateMasterEntity,
					CityMasterEntity,
					UserChannelMapping,
					ValidationBean,
					BusinessMaster,
					BusinessConfigurationMaster,
					PlaidLinkTokens,
					RefdocMaster,
					RefdocParticipantsMaster,
					RefdocTypeMaster,
					ValidationDocMasterProof,
					ValidationDocMonthlyProof,
					PaymentValidationdocMapping,
					UserCreditReportingDisputes,
					LanguageMaster,
					KafkaRequest,
					ValidationSchema,
					SchedulerMaster,
					PackageMaster,
					UserSubscriptionTransactions,
					ParticipantMapRequest,
					PaymentUsersMappingRequest,
					UserProfileProgress,
					CollegeMasterEntity,
					RefdocRejectionReasonMaster,
					RefdocDetails,
					RefdocDetailsHistoryEntity,
					RefdocHistory,
					PaymentSchedule,
					BlogArticle,
					BlogCategory,
					BlogUserArticles,
					DisputeEntity,
					DisputeHistoryEntity,
					DisputeTypeMaster,
					StatusMasterEntity,
					RefdocUsersEntity,
					PiiDataPermissions,
					UserPaymentSchedule,
					UserCreditReportingRequests,
					MonthlyVerifiedProofsEntity,
					NotSignedOption,
					MoneyOrderSource,
					LeaseFormats,
					NonCreditorList,
					DropdownOption,
					LeaseSpecificNonCreditorList,
					CreditorUpdatesAsync
				],
				namingStrategy: new SnakeNamingStrategy()
				// logging: true
			})
			// dataSourceFactory: async (options: DataSourceOptions) => {
			// 	console.log(
			// 		"\n\n[DATA-SOURCE]",
			// 		`[${options.type}] @ [${(<any>options)?.host}]:[${(<any>options).port}]\n\n`
			// 	);
			// 	const dataSource = await new DataSource(options).initialize();
			// 	return dataSource;
			// }
		}),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			name: "mongoDb",
			useFactory: (configService: ConfigService) => ({
				type: "mongodb",
				host: configService.get("DB_HOST_MONGO"),
				port: +configService.get("DB_PORT_MONGO"),
				username: configService.get("DB_USERNAME_MONGO"),
				password: configService.get("DB_PASSWORD_MONGO"),
				database: configService.get("DB_DATABASE_MONGO"),
				useNewUrlParser: false,
				useUnifiedTopology: false,
				// extra: { autoReconnect: false },
				synchronize: false,
				authSource: "admin",
				entities: [
					CommonMongoEntity,
					MongoCashierApisEntity,
					MongoBackofficeApis,
					MongoPlaidData,
					DashboardWeeklyData,
					DashboardMonthlyData,
					DashboardEightWeeksData
				],
				retryAttempts: 5,
				retryDelay: 50000
			})
		})
	],

	providers: [],
	exports: []
})
export class DatabaseModule {}
