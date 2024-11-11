import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum Status {
	"ACTIVE" = "ACTIVE",
	"INACTIVE" = "INACTIVE"
}

export enum LanguageScript {
	"LR" = "LR",
	"RL" = "RL"
}

@Entity({
	name: "sb_gen_language_master"
})
export class LanguageMaster {
	@PrimaryGeneratedColumn()
	languageId: number;

	@Column({ length: 2 })
	languageCode: string;

	@Column({ length: 3 })
	languageBaseCode: string;

	@Column()
	languageName: string;

	@Column({ type: "enum", enum: LanguageScript })
	languageScript: LanguageScript;

	@Column({ type: "enum", enum: Status })
	status: Status;

	constructor(
		languageCode: string,
		languageBaseCode: string,
		languageName: string,
		languageScript: LanguageScript,
		status: Status
	) {
		this.languageCode = languageCode;
		this.languageBaseCode = languageBaseCode;
		this.languageName = languageName;
		this.languageScript = languageScript;
		this.status = status;
	}
}
