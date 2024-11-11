import { PlaidTxnStatus } from "@modules/mongo/entities/mongoPlaidDataEntity";
import { ApiProperty } from "@nestjs/swagger";

export class GetMontlyProofFullDetailsDto {
	@ApiProperty()
	monthlyProofId: number;

	@ApiProperty()
	plaidTxnStatus: PlaidTxnStatus;
}
