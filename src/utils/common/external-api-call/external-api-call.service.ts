import { AppLoggerDto } from "@app-logger/app-logger.dto";
import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import VariablesConstant from "@utils/variables-constant";
import { firstValueFrom, switchMap } from "rxjs";
import { AppLoggerService } from "src/app-logger/app-logger.service";

@Injectable()
export class ExternalApiCallService {
	constructor(private readonly httpService: HttpService, private readonly appLoggerService: AppLoggerService) {}

	async getReq(url: string, queryParams: any, headers: any): Promise<any> {
		headers["Accept-Encoding"] = "gzip,deflate,compress";
		try {
			return firstValueFrom(
				this.httpService.get(url, { headers, params: queryParams }).pipe(switchMap(async (x: any) => x.data))
			);
		} catch (ex) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.ERROR,
				"error_in_external_api_get_request",
				"external_api_call",
				"ExternalApiCallService",
				"getReq",
				ex
			);
			appLoggerDto.addData(url, queryParams, headers);
			this.appLoggerService.writeLog(appLoggerDto);
		}
	}

	async postReq(headers: any, requestBody, url): Promise<any> {
		try {
			return firstValueFrom(
				this.httpService.post(url, requestBody, { headers }).pipe(switchMap(async (x: any) => x.data))
			);
		} catch (ex) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.ERROR,
				"error_in_external_api_post_request",
				"external_api_call",
				"ExternalApiCallService",
				"postReq",
				ex
			);
			appLoggerDto.addData(url);
			this.appLoggerService.writeLog(appLoggerDto);
		}
	}
}
