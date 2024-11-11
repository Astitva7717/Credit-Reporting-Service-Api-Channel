import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as cookieParser from "cookie-parser";
import * as compression from "compression";
import { FastifyCorsOptions, fastifyCors } from "@fastify/cors";

import { AppModule } from "./app.module";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { CommonExceptionFilter } from "./utils/filters/commonException/common-exception.filter";
import { ResponseInterceptor } from "./utils/middlewares/response/response.interceptor";
import { AppLoggerService } from "./app-logger/app-logger.service";
import * as fastifyHelmet from "@fastify/helmet";
import fastifyRateLimiter from "@fastify/rate-limit";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { ConfigService } from "./config/config.service";
import initServerConfig from "./config/configuration";
import fastyfyMultipart from "@fastify/multipart";
import { ConfigurationService } from "@utils/configuration/configuration.service";
require("dotenv").config();

(async () => {
	const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ logger: true }));

	const configService: ConfigService = app.get<ConfigService>(ConfigService);
	const isProd: boolean = configService.isEnv("prod");
	const { server, project, swagger } = initServerConfig(configService);

	const logger: Logger = new Logger(`MAIN`);

	app.useLogger(isProd ? app.get(WINSTON_MODULE_NEST_PROVIDER) : ["debug", "error", "log", "verbose", "warn"]);
	const port = server.port;
	app.use([cookieParser(), compression()]);
	const configurationService: ConfigurationService = app.get<ConfigurationService>(ConfigurationService);
	let maxFileSize = +process.env.UPLOADED_FILE_SIZE;
	app.useGlobalFilters(new CommonExceptionFilter(new AppLoggerService(configService), configurationService));
	app.useGlobalInterceptors(new ResponseInterceptor());
	if (!!swagger.enabled) {
		const pubOptions = new DocumentBuilder()
			.setTitle(`${project.name}`)
			.setDescription(`Swagger: ${project.description}`)
			.setVersion(`${project.version}`)
			// .addBearerAuth()
			.addBearerAuth(
				{
					description: `Please enter token in following format: Bearer <JWT>`,
					name: "Authorization",
					bearerFormat: "Bearer",
					scheme: "Bearer",
					type: "http",
					in: "Header"
				},
				"access-token"
			)
			.build();
		const document = SwaggerModule.createDocument(app, pubOptions);
		SwaggerModule.setup(`${server.context}/${swagger.path}`, app, document);
	}
	app.register(fastifyHelmet);
	app.register(fastyfyMultipart, {
		limits: {
			// Set the maximum file size here (in bytes)
			fileSize: 1024 * 1024 * maxFileSize
		}
	});
	app.register(fastifyRateLimiter, { max: 100, timeWindow: 60000 });
	app.useGlobalPipes(new ValidationPipe());

	if (server.corsEnabled) {
		const corsOptions: FastifyCorsOptions = { origin: true, credentials: true };
		app.register(fastifyCors, corsOptions);
	}

	// app.enableShutdownHooks();
	// app.get(AppModule).subscribeToShutdown(async () => {
	// 	await app.close();
	// });

	await app.listen(port, "0.0.0.0", async () => {
		logger.log(`📚 Swagger is running on: http://localhost:${port}/${server.context}/${swagger.path}`);
		logger.log(`🚀 Application is running on: http://localhost:${port}/${server.context}`);
	});
})();

process.on("unhandledRejection", (err: Error): void => {
	const logger = new Logger(`[MAIN] [unhandledRejection]`);
	logger.error(err.stack);
});
