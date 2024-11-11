import { PaymentStatusEnum, SubscriptionPaymentTypeEnum, YesNoEnum } from "@utils/enums/Status";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({
	name: "sb_crs_user_subscription_transactions"
})
export class UserSubscriptionTransactions {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	referenceSubscriptionId: number;

	@Column()
	packageId: number;

	@Column()
	userId: number;

	@Column()
	benificiaryUserId: number;

	@Column({ type: "enum", enum: SubscriptionPaymentTypeEnum, nullable: true })
	paymentType: SubscriptionPaymentTypeEnum;

	@Column()
	refdocId: number;

	@Column({ length: 3 })
	subscriptionMonth: string;

	@Column()
	subscriptionYear: number;

	@Column()
	autodebitRetryCount: number;

	@Column()
	renewalMonth: Date;

	@Column({ type: "tinyint" })
	autoRenewal: boolean;

	@Column({ type: "float" })
	price: number;

	@Column({ length: 255 })
	paymentMethodId: string;

	@Column({ type: "float" })
	paymentAmount: number;

	@Column()
	validTill: Date;

	@Column({ length: 50, nullable: true })
	referenceId: string;

	@Column({ type: "enum", enum: PaymentStatusEnum })
	status: PaymentStatusEnum;

	@Column({ type: "enum", enum: YesNoEnum })
	isFirstSubscription: YesNoEnum;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	constructor(
		packageId: number,
		userId: number,
		benificiaryUserId: number,
		renewalMonth: Date,
		autoRenewal: boolean,
		price: number,
		paymentAmount: number
	) {
		this.packageId = packageId;
		this.userId = userId;
		this.benificiaryUserId = benificiaryUserId;
		this.renewalMonth = renewalMonth;
		this.autoRenewal = autoRenewal;
		this.price = price;
		this.paymentAmount = paymentAmount;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}

	addSubscriptionTransactionDetails(
		validTill: Date,
		status: PaymentStatusEnum,
		refdocId: number | null,
		paymentType: SubscriptionPaymentTypeEnum | null,
		paymentMethodId: string,
		referenceId: string = null
	) {
		this.validTill = validTill;
		this.status = status;
		this.refdocId = refdocId;
		this.paymentType = paymentType;
		this.paymentMethodId = paymentMethodId;
		this.referenceId = referenceId;
	}

	setFirstSubscription(isFirstSubscription: YesNoEnum) {
		this.isFirstSubscription = isFirstSubscription;
		this.updatedAt = new Date();
	}

	updateSubscriptionStatus(status: PaymentStatusEnum) {
		this.status = status;
		this.updatedAt = new Date();
	}

	updateReferenceId(referenceId: string) {
		this.referenceId = referenceId;
		this.updatedAt = new Date();
	}

	updateReferenceSubscriptionId(referenceSubscriptionId: number) {
		this.referenceSubscriptionId = referenceSubscriptionId;
		this.updatedAt = new Date();
	}

	updateSubscriptionMonthAndYear(subscriptionMonth: string, subscriptionYear: number) {
		this.subscriptionMonth = subscriptionMonth;
		this.subscriptionYear = subscriptionYear;
		this.updatedAt = new Date();
	}

	updateSubscriptionAutoRenewal(autoRenewal: boolean) {
		this.autoRenewal = autoRenewal;
		this.updatedAt = new Date();
	}
}
