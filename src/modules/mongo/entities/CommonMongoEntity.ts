import { Column, Entity, ObjectId, ObjectIdColumn } from "typeorm";

@Entity()
export class CommonMongoEntity {
	@ObjectIdColumn()
	id: ObjectId;

	@Column()
	requestUrl: object;

	@Column()
	requestHeader: object;

	@Column()
	request: object;

	@Column()
	response: object;

	@Column()
	serviceCode: string;

	@Column()
	requestType: string;

	@Column()
	createdAt: Date;

	@Column()
	endAt: Date;

	constructor(
		requestUrl: object,
		requestHeader: object,
		request: object,
		response: object,
		serviceCode: string,
		requestType: string
	) {
		this.requestUrl = requestUrl;
		this.requestHeader = requestHeader;
		this.request = request;
		this.response = response;
		this.serviceCode = serviceCode;
		this.requestType = requestType;
		this.createdAt = new Date();
	}

	public update(response: object, responseTime: Date) {
		this.response = response;
		this.endAt = responseTime;
		return this;
	}
}
