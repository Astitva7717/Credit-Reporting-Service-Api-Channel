import { Module } from "@nestjs/common";
import { ConfigService } from "src/config";
import { ConfigModule } from "src/config/config.module";
import { RedisModule } from "@liaoliaots/nestjs-redis";

@Module({
	imports: [
		RedisModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				config: {
					host: configService.get("REDIS_HOST").toString(),
					port: +configService.get("REDIS_PORT")
				}
			})
		})
	]
})
export class RedisConfigModule {}
