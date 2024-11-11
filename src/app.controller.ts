import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
	@Get()
	hello() {
		return {
			message: `Hello there, Server is running !`
		};
	}
}
