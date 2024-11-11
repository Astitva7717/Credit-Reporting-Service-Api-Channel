import { Injectable } from "@nestjs/common";
import { ConfigService } from "src/config";

@Injectable()
export class ExternalUrlsService {
	cashierStripeUrl: string;
	cashierCardDetailsUrl: string;
	cashierStripeRequeryUrl: string;
	cashierGenerateTxnTokenUrl: string;
	plaidCategoryUrl: string;
	updateConsumerProfileUrl: string;

	constructor(private readonly configService: ConfigService) {
		this.cashierStripeUrl = `${this.configService.get("STRIPE_PAYMENT_URL")}${this.configService.get(
			"STRIPE_CASHIER_DEPOSIT_REQUEST"
		)}`;
		this.cashierCardDetailsUrl = `${this.configService.get("STRIPE_PAYMENT_URL")}${this.configService.get(
			"CARD_DETAILS_REQUEST"
		)}`;
		this.cashierStripeRequeryUrl = `${this.configService.get("STRIPE_PAYMENT_URL")}${this.configService.get(
			"STRIPE_CASHIER_REQUERY_REQUEST"
		)}`;
		this.cashierGenerateTxnTokenUrl = `${this.configService.get("STRIPE_PAYMENT_URL")}${this.configService.get(
			"STRIPE_GENERATE_TXN_TOKEN"
		)}`;
		this.plaidCategoryUrl = `${this.configService.get("PLAID_URL")}${this.configService.get("PLAID_CATEGORY_REQUEST")}`;
		this.updateConsumerProfileUrl = `${this.configService.get("CAM_BACKEND_BASE_URL")}${this.configService.get(
			"UPDATE_CONSUMER_PROFILE_URL"
		)}`;
	}
}
