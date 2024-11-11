export class AppLoggerDto {
	logLevel: string;
	logName: string;
	module: string;
	className: string;
	methodName: string;
	ex: any;
	message: string;
	request: any;
	data1: string;
	data2: string;
	data3: string;
	data4: string;

	constructor(logLevel: string, logName: string, module: string, className: string, methodName: string, exception: any) {
		this.logLevel = logLevel;
		this.logName = logName;
		this.module = module;
		this.className = className;
		this.methodName = methodName;
		this.ex = exception;
	}

	addMethodAndRequest(message: string, request: any) {
		this.message = message;
		this.request = request;
	}

	addData(data1: string, data2: string = null, data3: string = null, data4: string = null) {
		this.data1 = data1;
		this.data2 = data2;
		this.data3 = data3;
		this.data4 = data4;
	}
}
