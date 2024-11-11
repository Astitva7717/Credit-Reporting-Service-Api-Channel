import { UserType } from "@utils/enums/user-types";

export type InviteUserParams = {
	invitationLink: string;
	invitationCode: string;
	userName: string;
};

export type LeaseEventParams = {
	firstName: string;
	lastName: string;
	docType: string;
	refdocType: string;
};

export type InboxDeepLinkParams = {
	screenName: string;
	screenReferenceId: number;
};

export type MonthlyProofDueEventParams = {
	firstName: string;
	lastName: string;
	docType: string;
	proofType: string;
};

export type DisputeEventParams = {
	firstName: string;
	lastName: string;
	disputeID: number;
};

export enum KafkaEventTypeEnum {
	INVITE_USER = "INVITE_USER",
	UPLOAD_SUCCESSFUL = "UPLOAD_SUCCESSFUL",
	VERFICATION_SUCCESSFUL = "VERFICATION_SUCCESSFUL",
	VERFICATION_FAILED = "VERFICATION_FAILED",
	UPLOAD_DUE = "UPLOAD_DUE",
	DATA_DISCREPANCY = "DATA_DISCREPANCY",
	DOCUMENT_EXPIRY = "DOCUMENT_EXPIRY",
	DISPUTE_RAISED = "DISPUTE_RAISED",
	DISPUTE_CLOSED = "DISPUTE_CLOSED",
	DISPUTE_UPDATES = "DISPUTE_UPDATES"
}

export class KafkaEventMessageDto {
	aliasName: string;
	currencyCode: string;
	mobileNo: string | null;
	emailId: string | null;
	userType: UserType;
	systemUserId: number | null;
	businessId: number;
	params: Object;
	inboxDeepLinkParams: Object;

	constructor(
		aliasName: string,
		currencyCode: string,
		mobileNo: string | null,
		emailId: string | null,
		userType: UserType
	) {
		this.aliasName = aliasName;
		this.currencyCode = currencyCode;
		this.mobileNo = mobileNo;
		this.emailId = emailId;
		this.userType = userType;
	}

	addDetails(systemUserId: number | null, businessId: number) {
		this.systemUserId = systemUserId;
		this.businessId = businessId;
	}

	addParmas(params: Object) {
		this.params = params;
	}

	addInboxDeepLinkParams(params: Object) {
		this.inboxDeepLinkParams = params;
	}
}
