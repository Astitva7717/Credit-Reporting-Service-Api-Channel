export class StripePaymentInitiateDto {
	amount: number;
	currencyCode: string;
	depositData: string;
	deviceType: string;
	aliasName: string;
	paymentTypeCode: string;
	paymentTypeId: number;
	consumerId: number;
	subTypeId: number;
	txnType: string;
	userAgent: string;
	isFromClient: boolean;
	saleRefNo: number;

	constructor(
		amount: number,
		currencyCode: string,
		depositData: string,
		deviceType: string,
		aliasName: string,
		paymentTypeCode: string
	) {
		this.aliasName = aliasName;
		this.amount = amount;
		this.currencyCode = currencyCode;
		this.depositData = depositData;
		this.deviceType = deviceType;
		this.paymentTypeCode = paymentTypeCode;
	}

	addStripeDetails(
		subTypeId: number,
		txnType: string,
		userAgent: string,
		paymentTypeId: number,
		consumerId: number
	) {
		this.paymentTypeId = paymentTypeId;
		this.subTypeId = subTypeId;
		this.txnType = txnType;
		this.userAgent = userAgent;
		this.consumerId = consumerId;
	}

	addIsFromClient(isFromClient: boolean) {
		this.isFromClient = isFromClient;
	}

	updateSaleRefNo(saleRefNo: number) {
		this.saleRefNo = saleRefNo;
	}
}
