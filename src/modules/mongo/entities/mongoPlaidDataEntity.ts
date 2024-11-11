import { Column, Entity, ObjectId, ObjectIdColumn } from "typeorm";

export enum PlaidTxnStatus {
	NEW = "NEW",
	NOT_FILTERED = "NOT_FILTERED",
	NOT_CONSIDERED = "NOT_CONSIDERED",
	CRYREMP_REJECTED = "CRYREMP_REJECTED",
	CRYREMP_QUALIFIED = "CRYREMP_QUALIFIED",
	CRYRBOT_REJECTED = "CRYRBOT_REJECTED",
	CRYRBOT_QUALIFIED = "CRYRBOT_QUALIFIED",
	NO_CREDITOR = "NO_CREDITOR",
	NO_MATCHING_CREDITOR = "NO_MATCHING_CREDITOR",
	APPROVAL_PENDING = "APPROVAL_PENDING",
	QUALIFIED = "QUALIFIED",
	REJECTED = "REJECTED",
	REDUNDANT = "REDUNDANT"
}

export enum MonthMatchingStatus {
	UNASSIGNED = "UNASSIGNED",
	CRYRBOT_ASSIGNED = "CRYRBOT_ASSIGNED",
	CRYREMP_ASSIGNED = "CRYREMP_ASSIGNED"
}

export enum ScheduleStatusEnum {
	UPDATED = "UPDATED",
	NOT_UPDATED = "NOT_UPDATED"
}

@Entity()
export class MongoPlaidData {
	@ObjectIdColumn()
	id: ObjectId;

	@Column()
	refdocId: number;

	@Column()
	masterProofId: number;

	@Column()
	plaidData: object;

	@Column()
	status: PlaidTxnStatus;

	@Column()
	monthMatching: MonthMatchingStatus;

	@Column()
	month: string;

	@Column()
	year: number;

	@Column()
	scheduleStatus: ScheduleStatusEnum;

	constructor(
		refdocId: number,
		masterProofId: number,
		plaidData: object,
		status = PlaidTxnStatus.NEW,
		monthMatching = MonthMatchingStatus.UNASSIGNED
	) {
		this.refdocId = refdocId;
		this.masterProofId = masterProofId;
		this.plaidData = plaidData;
		this.status = status;
		this.monthMatching = monthMatching;
	}
}
