import { ApiProperty } from "@nestjs/swagger";

export class UpdateConsumerProfileDto {
	@ApiProperty({ description: "Alias name of the consumer" })
	aliasName: string;

	@ApiProperty({ description: "First line of the address" })
	addressLine1: string;

	@ApiProperty({ description: "Second line of the address", required: false })
	addressLine2: string;

	@ApiProperty({ description: "Country code of the consumer" })
	countryCode: string;

	@ApiProperty({ description: "System consumer ID" })
	systemConsumerId: number;

	@ApiProperty({ description: "State code of the consumer" })
	stateCode: string;

	@ApiProperty({ description: "Nationality of the consumer" })
	nationality: string;

	@ApiProperty({ description: "Status of the consumer" })
	consumerStatus: string;

	@ApiProperty({ description: "City of the consumer" })
	city: string;

	@ApiProperty({ description: "Zip code of the consumer" })
	zipCode: string;

	@ApiProperty({ description: "name of the consumer" })
	name: string;

	@ApiProperty({ description: "job of the consumer" })
	job: string;
}
