import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ResponseData } from "src/utils/enums/response";

@Injectable()
export class ValidateStructureService {
	async validate(entityStructure: string, requestMap: any, requestType: string) {
		let requestEntity;
		let userRequest = null;
		try {
			requestEntity = JSON.parse(entityStructure);
			userRequest = requestMap;
		} catch (e) {
			throw new HttpException({ status: ResponseData["VALIDATION_ERROR"] }, HttpStatus.OK);
		}

		const requiredField = requestEntity["required"];
		const dateFields = requestEntity["date"];
		const mapOfLength = requestEntity["length"];
		const mapOfEnum = requestEntity["enum"];
		const mapOfRegex = requestEntity["regex"];
		const numericList = requestEntity["numeric"];

		if (requestType === "GET") {
			await this.validateGetRequest(
				userRequest,
				requiredField,
				mapOfLength,
				mapOfEnum,
				mapOfRegex,
				dateFields,
				numericList
			);
		} else {
			await this.validateJson(userRequest, requiredField, mapOfLength, mapOfEnum, mapOfRegex, dateFields, numericList);
		}
	}

	async validateGetRequest(userRequest, requiredField, mapOfLength, mapOfEnum, mapOfRegex, dateFields, numericList) {
		if (requiredField) {
			for (const field of requiredField) {
				if (!userRequest.get(field) || !userRequest.get(field)?.toString()?.trim()?.length) {
					throw new HttpException(
						{
							status: {
								errorCode: ResponseData["REQUIRED_VALIDATION_ERROR"].errorCode,
								errorMessage: ResponseData["REQUIRED_VALIDATION_ERROR"].errorMessage.replace("##@@##", field)
							}
						},
						HttpStatus.OK
					);
				}
			}
		}

		for (const req of userRequest.entries()) {
			await this.validateOtherFields(req[0], req[1], mapOfLength, mapOfEnum, mapOfRegex, dateFields, numericList);
		}
	}

	async validateJson(userIntenalMap, requiredField, mapOfLength, mapOfEnum, mapOfRegex, dateFields, numericList) {
		if (!userIntenalMap || Object.entries(userIntenalMap)?.length <= 0) {
			throw new HttpException({ status: ResponseData["INVALID_REQUEST_FORMAT"] }, HttpStatus.OK);
		}
		if (requiredField) {
			for (const field of requiredField) {
				if (
					(!userIntenalMap[field] && userIntenalMap[field] != "0") ||
					!userIntenalMap[field]?.toString()?.trim()?.length
				) {
					throw new HttpException(
						{
							status: {
								errorCode: ResponseData["REQUIRED_VALIDATION_ERROR"].errorCode,
								errorMessage: ResponseData["REQUIRED_VALIDATION_ERROR"].errorMessage.replace("##@@##", field)
							}
						},
						HttpStatus.OK
					);
				}
			}
		}

		for (const internalMapKey in userIntenalMap) {
			const internalValue = userIntenalMap[internalMapKey];
			const mapOfObj = { mapOfLength, mapOfEnum, mapOfRegex };
			if (internalValue instanceof Map) {
				await this.validateJson(
					internalValue,
					requiredField,
					mapOfLength,
					mapOfEnum,
					mapOfRegex,
					dateFields,
					numericList
				);
			} else if (Array.isArray(internalValue)) {
				await this.validateArrayList(
					internalMapKey,
					internalValue,
					requiredField,
					mapOfObj,
					dateFields,
					numericList
				);
			} else {
				await this.validateA(internalMapKey, internalValue, requiredField, mapOfObj, dateFields, numericList);
			}
		}
	}

	// @SuppressWarnings("unchecked")
	async validateArrayList(key, arrayObject, requiredField, mapOfObj, dateFields, numericList) {
		const internalValueArray = arrayObject;
		if (!internalValueArray.length && requiredField?.includes(key)) {
			throw new HttpException(
				{
					status: {
						errorCode: ResponseData["REQUIRED_VALIDATION_ERROR"].errorCode,
						errorMessage: ResponseData["REQUIRED_VALIDATION_ERROR"].errorMessage.replace(
							"##@@##",
							"interval array"
						)
					}
				},
				HttpStatus.OK
			);
		}
		for (const ob of internalValueArray) {
			if (ob instanceof Map) {
				await this.validateJson(
					ob,
					requiredField,
					mapOfObj["mapOfLength"],
					mapOfObj["mapOfEnum"],
					mapOfObj["mapOfRegex"],
					dateFields,
					numericList
				);
			} else if (ob instanceof Array) {
				await this.validateArrayList(key, ob, requiredField, mapOfObj, dateFields, numericList);
			} else {
				await this.validateA(key, ob, requiredField, mapOfObj, dateFields, numericList);
			}
		}
	}

	async validateA(key, value, requiredField, mapOfObj, dateFields, numericList) {
		if (
			requiredField?.includes(key) &&
			(typeof value === "number" ? value.toString() : true) &&
			!value?.toString()?.trim()
		) {
			throw new HttpException(
				{
					status: {
						errorCode: ResponseData["REQUIRED_VALIDATION_ERROR"].errorCode,
						errorMessage: ResponseData["REQUIRED_VALIDATION_ERROR"].errorMessage.replace("##@@##", key)
					}
				},
				HttpStatus.OK
			);
		}

		await this.validateOtherFields(
			key,
			value,
			mapOfObj["mapOfLength"],
			mapOfObj["mapOfEnum"],
			mapOfObj["mapOfRegex"],
			dateFields,
			numericList
		);
	}

	async validateOtherFields(key: string, value, mapOfLength, mapOfEnum, mapOfRegex, dateFields, numericList) {
		if (value) {
			await this.checkMapOfLength(mapOfLength, key, value);
			await this.checkMapOfEnum(mapOfEnum, key, value);
			await this.checkMapOfRegex(mapOfRegex, key, value);

			if (dateFields?.contains(key)) {
				try {
					// new SimpleDateFormat(VariablesConstant.DATE_FORMAT).parse((string) value);
				} catch (e) {
					throw new HttpException(
						{
							status: {
								errorCode: ResponseData["DATE_VALIDATION_ERROR"].errorCode,
								errorMessage: ResponseData["DATE_VALIDATION_ERROR"].errorMessage.replace("##@@##", key)
							}
						},
						HttpStatus.OK
					);
				}
			}

			if (numericList?.contains(key) && value < 0) {
				throw new HttpException(
					{
						status: {
							errorCode: ResponseData["REQUIRED_VALIDATION_ERROR"].errorCode,
							errorMessage: ResponseData["REQUIRED_VALIDATION_ERROR"].errorMessage.replace("##@@##", key)
						}
					},
					HttpStatus.OK
				);
			}
		}
	}

	async checkMapOfLength(mapOfLength, key, value) {
		if (mapOfLength?.[key] && value?.length > mapOfLength[key]) {
			throw new HttpException(
				{
					status: {
						errorCode: ResponseData["LENGTH_VALIDATION_ERROR"].errorCode,
						errorMessage: ResponseData["LENGTH_VALIDATION_ERROR"].errorMessage.replace("##@@##", key)
					}
				},
				HttpStatus.OK
			);
		}
	}

	async checkMapOfEnum(mapOfEnum, key, value) {
		if (mapOfEnum?.[key]) {
			const enums = mapOfEnum[key];
			if (!enums.includes(value)) {
				throw new HttpException(
					{
						status: {
							errorCode: ResponseData["REQUIRED_VALIDATION_ERROR"].errorCode,
							errorMessage: ResponseData["REQUIRED_VALIDATION_ERROR"].errorMessage.replace("##@@##", key)
						}
					},
					HttpStatus.OK
				);
			}
		}
	}

	async checkMapOfRegex(mapOfRegex, key, value) {
		if (mapOfRegex?.[key] && mapOfRegex[key]?.test(value)) {
			throw new HttpException(
				{
					status: {
						errorCode: ResponseData["REGEX_VALIDATION_ERROR"].errorCode,
						errorMessage: ResponseData["REGEX_VALIDATION_ERROR"].errorMessage.replace("##@@##", key)
					}
				},
				HttpStatus.OK
			);
		}
	}
}
