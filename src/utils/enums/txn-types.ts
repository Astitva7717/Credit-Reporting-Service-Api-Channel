import { DepositoryAccountSubtype } from "plaid";

export enum PaymentActionTypeEnum {
	TRANSACTION = "TRANSACTION"
}

export enum StripeResponseEnum {
	DONE = "DONE",
	FAILED = "FAILED"
}

export enum PaymentTypeEnum {
	DEPOSIT = "DEPOSIT"
}

export enum PaymentTypePlaidSubTypesMapping {
	DC = DepositoryAccountSubtype.Savings,
	CC = DepositoryAccountSubtype.Checking,
	CHEQUE = DepositoryAccountSubtype.Savings,
	MO = DepositoryAccountSubtype.Savings,
	ALL = DepositoryAccountSubtype.All
}

export enum MonthlyProofTypeEnum {
	RECEIPT = "RECEIPT",
	TRANSACTION = "TRANSACTION"
}
