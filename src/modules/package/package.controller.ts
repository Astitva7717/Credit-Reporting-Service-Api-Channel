import { Controller, Get, Post, Body, UseGuards, Request, Query } from "@nestjs/common";
import { PackageService } from "./package.service";
import { CreatePackageDto } from "./dto/create-package.dto";
import { ApiBearerAuth, ApiBody, ApiHeader, ApiHeaders, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserPackageSubscriptionDto } from "./dto/UserPackageSubscription.dto";
import { AuthenticationGuard } from "@utils/guards/authentication/authentication-gaurd";
import { RequetsValidationGuard } from "@utils/guards/validation/request-validation.guard";
import { GetPaymentIdDto } from "./dto/get-payment-id.dto";
import { CancelSubscriptionDto } from "./dto/cancel-subscription.dto";
import postloginDto from "@modules/doc/dto/postlogin.dto";
import { KafkaPurchaseInititateDto } from "./dto/kafka-purchase-initiate.dto";

@UseGuards(AuthenticationGuard, RequetsValidationGuard)
@ApiTags("Package Management")
@Controller("")
export class PackageController {
	constructor(private readonly packageService: PackageService) {}

	//v1.0
	@Post("v1.0/package/add")
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiOperation({ summary: "Create new package." })
	create(@Body() createPackageDto: CreatePackageDto) {
		return this.packageService.create(createPackageDto);
	}

	@Get("v1.0/package/all")
	@ApiBearerAuth("access-token")
	@ApiHeader({ name: "backofficeToken", description: "Is backoffice token", required: true })
	@ApiOperation({ summary: "Get all packages." })
	getAllPackages() {
		return this.packageService.getAllPackagesByRefDocType();
	}

	//PreLogin
	@Post("preLogin/getPackages")
	@ApiHeaders([{ name: "clientCode", description: "Client Code", required: true }])
	@ApiOperation({ summary: "Get Packages by ref doc type" })
	@ApiBody({
		description: "Request body description",
		schema: {
			properties: {
				refDocTypeId: { type: "number" }
			}
		}
	})
	getPackagesByRefDocType(@Body() body: { refDocTypeId: number }) {
		return this.packageService.getAllPackagesByRefDocType(body.refDocTypeId);
	}

	@ApiOperation({ summary: "Fetch Payment types." })
	@ApiHeaders([{ name: "clientCode", description: "Client Code", required: true }])
	@Get("preLogin/getpaymentTypes")
	getpaymentTypes() {
		return this.packageService.getPaymentTypes();
	}

	//PostLogin
	@ApiOperation({ summary: "Get user purchased package for refdoc." })
	@ApiHeaders(postloginDto)
	@Get("postLogin/getUserRefdocSubscription")
	getUserRefdocSubscription(@Query() userPackageSubscriptionDto: UserPackageSubscriptionDto, @Request() request: any) {
		return this.packageService.getUserRefdocSubscription(userPackageSubscriptionDto, request);
	}

	@ApiOperation({ summary: "Getting payment history." })
	@ApiHeaders(postloginDto)
	@Get("postLogin/getPaymentHistory")
	getPaymentHistory(@Request() request: any) {
		return this.packageService.getPaymentHistoryData(request);
	}

	@ApiOperation({ summary: "Getting payment id from refdoc Id." })
	@ApiHeaders(postloginDto)
	@Get("postLogin/getPaymentId")
	getPaymentId(@Query() getPaymentIdDto: GetPaymentIdDto, @Request() request: any) {
		return this.packageService.getPaymentId(getPaymentIdDto, request);
	}

	@ApiOperation({ summary: "Cancel stripe subscription." })
	@ApiHeaders(postloginDto)
	@Post("postLogin/cancelSubscription")
	cancelSubscription(@Body() cancelSubscriptionDto: CancelSubscriptionDto, @Request() request: any) {
		return this.packageService.cancelSubscription(cancelSubscriptionDto, request);
	}

	@Post("rescheduleAllowed/purchaseFromKafka")
	@ApiOperation({ summary: "Stripe auto debit requery Reshedular." })
	stripePaymentRequery(@Body() cancelSubscriptionDto: KafkaPurchaseInititateDto) {
		return this.packageService.purchaseInitiateFromKafka(cancelSubscriptionDto);
	}
}
