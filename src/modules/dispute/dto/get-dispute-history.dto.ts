import { ApiProperty } from "@nestjs/swagger";

export class GetDistputeHistoryDto {
	@ApiProperty()
	disputeId: number;
}
