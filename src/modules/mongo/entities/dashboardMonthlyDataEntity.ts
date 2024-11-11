import { Column, Entity, ObjectId, ObjectIdColumn } from "typeorm";

@Entity()
export class DashboardMonthlyData {
	@ObjectIdColumn()
	id: ObjectId;

	@Column()
	month: string;

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
