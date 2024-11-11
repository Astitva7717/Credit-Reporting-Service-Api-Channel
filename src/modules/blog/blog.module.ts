import { Module } from "@nestjs/common";
import { BlogService } from "./blog.service";
import { BlogController } from "./blog.controller";
import { DaoModule } from "@modules/dao/dao.module";
import { MongoModule } from "@modules/mongo/mongo.module";
import { UtilsModule } from "@utils/utils.module";
import { AppLoggerModule } from "src/app-logger/app-logger.module";
import { BlogHelperService } from "./blog-helper/blog-helper";
import { ConfigService } from "@nestjs/config";

@Module({
	controllers: [BlogController],
	providers: [BlogService, BlogHelperService ,ConfigService],
	imports: [DaoModule, UtilsModule, MongoModule, AppLoggerModule]
})
export class BlogModule {}
