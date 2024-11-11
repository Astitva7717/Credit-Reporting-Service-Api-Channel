export const AddDisputeCommentSchemaDto = {
	type: "object",
	properties: {
		disputeId: { type: "integer" },
		fileA: {
			type: "string",
			format: "binary"
		},
		fileB: {
			type: "string",
			format: "binary"
		},
		comment: { type: "string" }
	}
};

export const CreateDisputeSchemaDto = {
	type: "object",
	properties: {
		masterProofId: { type: "integer" },
		disputeReasonId: { type: "integer" },
		discription: { type: "string" },
		month: { type: "integer" },
		year: { type: "integer" },
		fileA: {
			type: "string",
			format: "binary"
		},
		fileB: {
			type: "string",
			format: "binary"
		}
	}
};
