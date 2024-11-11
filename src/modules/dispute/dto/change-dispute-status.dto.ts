import { ApiProperty } from "@nestjs/swagger";
import { DisputeStatusEnum } from "../entities/dispute.entity";

export class ChangeDisputeStatusDto {
	@ApiProperty()
	disputeId: number;

	@ApiProperty()
	disputeStatus: DisputeStatusEnum;
}