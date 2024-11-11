import { AppLoggerDto } from "@app-logger/app-logger.dto";
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from "@nestjs/common";
import { HttpArgumentsHost } from "@nestjs/common/interfaces";
import { ConfigurationService } from "@utils/configuration/configuration.service";

import { Response } from "express";
import { AppLoggerService } from "src/app-logger/app-logger.service";
import { ResponseData } from "src/utils/enums/response";
import VariablesConstant from "src/utils/variables-constant";

@Catch()
export class CommonExceptionFilter implements ExceptionFilter {
	constructor(private appLoggerService: AppLoggerService, private readonly configurationService: ConfigurationService) {}

	async catch(exception: any, host: ArgumentsHost) {
		const context = host.switchToHttp();
		if (exception.constructor?.name === HttpException.name) {
			return await this.handleHttpException(exception, context);
		} else if (exception.constructor.name === "FastifyError") {
			return await this.handleFastifyErrors(exception, context);
		} else {
			return await this.handleCommonError(exception, context);
		}
	}

	private async handleHttpException(exception: any, context: HttpArgumentsHost) {
		const response = context.getResponse<Response>();
		const request = context.getRequest<Request>();
		try {
			let res = exception.getResponse();
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.ERROR,
				"error_catch_in_commonexception_filter",
				"UtilsModule",
				"CommonExceptionFilter",
				"catch",
				exception
			);
			appLoggerDto.addMethodAndRequest("", request);
			this.appLoggerService.writeLog(appLoggerDto);
			if (res?.status) {
				return response.status(200).send({
					errorCode:
						res?.status?.errorCode === 0
							? res?.status?.errorCode
							: res?.status?.errorCode || ResponseData.UNKNOWN_ERROR_OCCURRED["errorCode"],
					errorMessage: res?.status?.errorMessage || ResponseData.UNKNOWN_ERROR_OCCURRED["errorMessage"],
					data: res?.data || {}
				});
			} else {
				return response.status(200).send(res);
			}
		} catch (e) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.ERROR,
				"error_catch_in_commonexception_filter",
				"UtilsModule",
				"CommonExceptionFilter",
				"catch",
				exception
			);
			appLoggerDto.addMethodAndRequest("", request);
			this.appLoggerService.writeLog(appLoggerDto);
			response.status(200).send({
				errorCode: ResponseData.UNKNOWN_ERROR_OCCURRED["errorCode"],
				errorMessage: ResponseData.UNKNOWN_ERROR_OCCURRED["errorMessage"],
				data: {}
			});
		}
	}

	private async handleCommonError(exception: any, context: HttpArgumentsHost) {
		const response = context.getResponse<Response>();
		const request = context.getRequest<Request>();
		const appLoggerDto: AppLoggerDto = new AppLoggerDto(
			VariablesConstant.ERROR,
			"error_catch_in_commonexception_filter",
			"UtilsModule",
			"CommonExceptionFilter",
			"catch",
			exception
		);
		appLoggerDto.addMethodAndRequest("", request);
		this.appLoggerService.writeLog(appLoggerDto);
		response.status(200).send({
			errorCode: ResponseData.UNKNOWN_ERROR_OCCURRED["errorCode"],
			errorMessage: ResponseData.UNKNOWN_ERROR_OCCURRED["errorMessage"],
			data: {}
		});
	}

	private async handleFastifyErrors(exception: any, context: HttpArgumentsHost) {
		const response = context.getResponse<Response>();
		const request = context.getRequest<Request>();
		try {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.ERROR,
				"error_catch_in_commonexception_filter",
				"UtilsModule",
				"CommonExceptionFilter",
				"catch",
				exception
			);
			appLoggerDto.addMethodAndRequest("", request);
			this.appLoggerService.writeLog(appLoggerDto);
			if (exception.code === "FST_REQ_FILE_TOO_LARGE") {
				const configMap = await this.configurationService.getBusinessConfigurations(0);
				const maxFileSize = configMap.get("UPLOADED_FILE_SIZE") ? configMap.get("UPLOADED_FILE_SIZE") : "2";
				return response.status(200).send({
					errorCode: ResponseData.REFDOC_FILE__SIZE_TOO_LARGE["errorCode"],
					errorMessage: ResponseData["REFDOC_FILE__SIZE_TOO_LARGE"]["errorMessage"].replace("##@@##", maxFileSize),
					data: {}
				});
			} else {
				response.status(200).send({
					errorCode: ResponseData.UNKNOWN_ERROR_OCCURRED["errorCode"],
					errorMessage: ResponseData.UNKNOWN_ERROR_OCCURRED["errorMessage"],
					data: {}
				});
			}
		} catch (e) {
			const appLoggerDto: AppLoggerDto = new AppLoggerDto(
				VariablesConstant.ERROR,
				"error_catch_in_commonexception_filter",
				"UtilsModule",
				"CommonExceptionFilter",
				"catch",
				exception
			);
			appLoggerDto.addMethodAndRequest("", request);
			this.appLoggerService.writeLog(appLoggerDto);
			response.status(200).send({
				errorCode: ResponseData.UNKNOWN_ERROR_OCCURRED["errorCode"],
				errorMessage: ResponseData.UNKNOWN_ERROR_OCCURRED["errorMessage"],
				data: {}
			});
		}
	}
}
