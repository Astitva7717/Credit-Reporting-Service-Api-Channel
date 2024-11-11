import { Controller, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthenticationGuard } from "@utils/guards/authentication/authentication-gaurd";
import { RequetsValidationGuard } from "@utils/guards/validation/request-validation.guard";
import { PackageSchedularService } from "./schedular.service";

@UseGuards(AuthenticationGuard, RequetsValidationGuard)
@ApiTags("Package Schedular Management")
@Controller("")
export class PackageSchedularController {
	constructor(private readonly packageSchedularService: PackageSchedularService) {}

	@Post("rescheduleAllowed/stripePayment")
	@ApiOperation({ summary: "Stripe auto debit Reshedular." })
	stripePayment() {
		return this.packageSchedularService.stripeAutoDebit();
	}

	@Post("rescheduleAllowed/stripePaymentRequery")
	@ApiOperation({ summary: "Stripe auto debit requery Reshedular." })
	stripePaymentRequery() {
		return this.packageSchedularService.stripeAutoDebitRequery();
	}
}
