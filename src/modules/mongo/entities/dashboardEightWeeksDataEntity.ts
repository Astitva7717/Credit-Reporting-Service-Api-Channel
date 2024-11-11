import { Column, Entity, ObjectId, ObjectIdColumn } from "typeorm";

@Entity()
export class DashboardEightWeeksData {
	@ObjectIdColumn()
	id: ObjectId;

	@Column()
	weekStartDate: Date;

	@Column()
	recurringSubscriptions: string;

	@Column()
	newSubscriptions: string;

	@Column()
	recurringSubscriptionsAmount: string;

	@Column()
	newSubscriptionsAmount: string;

	@Column()
	registeredUsers: string;

	@Column()
	refdocUploads: string;
	
    @Column()
    verifiedRefdoc: string;

	@Column()
	disputesRaised: string;

    @Column()
	disputesClosed: string;
}