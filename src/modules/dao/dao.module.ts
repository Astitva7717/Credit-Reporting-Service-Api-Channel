import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ValidationBean } from "src/utils/common-entities/validation-schema-entity";
import { CityMasterEntity } from "../master-data/entities/city-master-entity";
import { ClientTokensEntity } from "../master-data/entities/client-token.entity";
import { CountryMasterEntity } from "../master-data/entities/country-master-entity";
import { StateMasterEntity } from "../master-data/entities/state-master-entity";
import { CommonMongoEntity } from "../mongo/entities/CommonMongoEntity";
import { UserChannelMapping } from "../user-master/entities/user-channel-mapping.entity";
import { UserMasterEntity } from "../user-master/entities/user-master.entity";
import { MasterDataDaoService } from "./master-data-dao/master-data-dao.service";
import { MongoDaoService } from "./mongo-dao/mongo-dao.service";
import { UserDaoService } from "./user-dao/user-dao.service";
import { ValidationDaoService } from "./validation-dao/validation-dao.service";
import { BusinessMaster } from "../business-master/entities/business-master.entity";
import { BusinessConfigurationMaster } from "../business-master/entities/business-configuration-master-entity";
import { BusinessDaoService } from "./business-dao/business-dao.service";
import { ChannelDaoService } from "./channel-dao/channel-dao.service";
import { ChannelMaster } from "../channel-master/entities/channel-master.entity";
import { ConfigurationMaster } from "../channel-master/entities/configuration-master-entity";
import { ChannelConfigurationMaster } from "../channel-master/entities/channel-configuration-master-entity";
import { AliasDaoService } from "./alias-dao/alias-dao.service";
import { AliasMaster } from "../alias-master/entities/alias-master.entity";
import { CommonDaoService } from "./common-dao/common-dao.service";
import { PlaidAuthDaoService } from "./plaid-auth-dao/plaid-auth-dao.service";
import { DocDaoService } from "./doc-dao/doc-dao.service";
import { KafkaRequestDaoService } from "./kafka-request-dao/kafka-request-dao.service";
import { SchedulerDaoService } from "./scheduler-dao/scheduler-dao.service";
import { KafkaRequest } from "src/kafka/entity/kafka-request.entity";
import { SchedulerMaster } from "../doc/entities/scheduler-master.entity";
import { PackageDaoService } from "./package-dao/package-dao.service";
import { ParticipantDaoService } from "./participant-dao/participant-dao.service";
import { MongoCashierApisEntity } from "@modules/mongo/entities/MongoCashierApisEntity";
import { CollegeDaoService } from "./college-dao/college-dao.service";
import { MonthlyDocDaoService } from "./monthly-doc-dao/monthly-doc-dao.service";
import { BlogDaoService } from "./blog-dao/blog-dao.service";
import { CurrencyConvertorMaster } from "@modules/currency-convertor/entities/currency-convertor-master.entity";
import { DisputeDaoService } from "./dispute-dao/dispute-dao.service";
import { DashboardDaoService } from "./dashboard-dao/dashboard-dao.service";
import { ReportingDaoService } from "./reporting-dao/reporting-dao.service";
import { MongoBackofficeApis } from "@modules/mongo/entities/MongoBackofficeApis";
import { MongoPlaidData } from "@modules/mongo/entities/mongoPlaidDataEntity";
import { DashboardWeeklyData } from "@modules/mongo/entities/dashboardWeeklyDataEntity";
import { DashboardMonthlyData } from "@modules/mongo/entities/dashboardMonthlyDataEntity";
import { DashboardEightWeeksData } from "@modules/mongo/entities/dashboardEightWeeksDataEntity";

@Module({
	imports: [
		TypeOrmModule.forFeature(
			[CommonMongoEntity, MongoCashierApisEntity, MongoBackofficeApis, MongoPlaidData, DashboardWeeklyData, DashboardMonthlyData, DashboardEightWeeksData],
			"mongoDb"
		),
		TypeOrmModule.forFeature([
			UserMasterEntity,
			ClientTokensEntity,
			CountryMasterEntity,
			StateMasterEntity,
			CityMasterEntity,
			UserChannelMapping,
			ValidationBean,
			BusinessMaster,
			BusinessConfigurationMaster,
			ChannelMaster,
			ConfigurationMaster,
			ChannelConfigurationMaster,
			AliasMaster,
			CurrencyConvertorMaster,
			KafkaRequest,
			SchedulerMaster
		])
	],
	providers: [
		UserDaoService,
		MasterDataDaoService,
		ValidationDaoService,
		MongoDaoService,
		BusinessDaoService,
		ChannelDaoService,
		AliasDaoService,
		CommonDaoService,
		PlaidAuthDaoService,
		DocDaoService,
		KafkaRequestDaoService,
		SchedulerDaoService,
		PackageDaoService,
		ParticipantDaoService,
		CollegeDaoService,
		MonthlyDocDaoService,
		BlogDaoService,
		DisputeDaoService,
		DashboardDaoService,
		ReportingDaoService
	],
	exports: [
		UserDaoService,
		MasterDataDaoService,
		ValidationDaoService,
		MongoDaoService,
		BusinessDaoService,
		ChannelDaoService,
		AliasDaoService,
		CommonDaoService,
		UserDaoService,
		PlaidAuthDaoService,
		DocDaoService,
		KafkaRequestDaoService,
		SchedulerDaoService,
		PackageDaoService,
		ParticipantDaoService,
		CollegeDaoService,
		MonthlyDocDaoService,
		BlogDaoService,
		DisputeDaoService,
		DashboardDaoService,
		ReportingDaoService
	]
})
export class DaoModule {}
