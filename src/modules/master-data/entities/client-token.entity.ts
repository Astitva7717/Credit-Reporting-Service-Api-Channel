import { Status } from "src/utils/enums/Status";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "sb_gen_client_tokens" })
export class ClientTokensEntity {
	@PrimaryGeneratedColumn()
	id?: number;

	@Column()
	clientCode!: string;

	@Column()
	token!: string;

	@Column()
	clientIps?: string;

	@Column()
	status?: Status;

	@CreateDateColumn()
	createdAt?: Date;
}
