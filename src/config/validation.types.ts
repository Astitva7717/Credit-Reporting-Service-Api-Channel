import * as joi from "joi";

export type ENV_TYPE = "local" | "test" | "dev" | "prod" | "uat" | "qa";

export interface PackageConfig {
	packageAuthor: string;
	packageName: string;
	packageVersion: string;
	packageDescription: string;
}

export interface EnvConfig extends PackageConfig {
	ENV: string;
	PORT: number;
	CONTEXT: string;
	ORIGINS: string;
	ALLOWED_HEADERS: string;
	ALLOWED_METHODS: string;
	CORS_ENABLED: boolean;
	CORS_CREDENTIALS: boolean;

	WRITE_LOG: boolean;
	MINIMUM_LOG_LEVEL: string;

	SWAGGER_PATH: string;
	SWAGGER_ENABLED: boolean;

	TEST_KEY: string;

	DB_TYPE: string;
	DB_HOST: string;
	DB_PORT: number;
	DB_USERNAME: string;
	DB_PASSWORD: string;
	DB_DATABASE: string;

	REDIS_HOST: string;
	REDIS_PORT: number;

	DB_TYPE_MONGO: string;
	DB_HOST_MONGO: string;
	DB_PORT_MONGO: number;
	DB_USERNAME_MONGO: string;
	DB_PASSWORD_MONGO: string;
	DB_DATABASE_MONGO: string;
	IS_MONGO_ENABLE: boolean;

	ENCRYPT_DECRYPT_KEY: string;

	PLAID_SECRET: string;
	PLAID_CLIENT_ID: string;

	KAFKA_BROKER: string;
	KAFKA_GROUP_ID: string;

	CRON_EXPRESSION: string;
	SYSTEM_REQUERING_TIME_IN_MILLISECONDS: string;

	KAFKA_REGISTER_USER_FAILED_EXPRESSION: string;
	KAFKA_UPDATE_USER_FAILED_EXPRESSION: string;
	KAFKA_STRIPE_PAYMENT_FAILED_EXPRESSION: string;
	KAFKA_INVITATION_FAILED_EXPRESSION: string;
	FETCH_PLAID_DATA_EXPRESSION: string;
	CHECK_REFDOC_VALIDITY_EXPRESSION: string;
	UPDATE_CURRENT_DAY_DASHBOARD_DATA_EXPRESSION: string;
	TAG_PLAID_TXN_EXPRESSION: string;
	HANDLE_QUALIFIED_MONTHLYPROOFS_EXPRESSION: string;
	MONTHLY_PROOF_INSERTION_EXPRESSION: string;
	SCHEDULER_UPDATE_EXPRESSION: string;
	STRIPE_PAYMENT_URL: string;
	STRIPE_CASHIER_DEPOSIT_REQUEST: string;
	STRIPE_GENERATE_TXN_TOKEN: string;
	CRYR_FRONTEND_BASE_URL: string;
	CRYR_PAYMENT_REQUEST: string;
	CRYR_PARTICIPANT_INVITATION: string;
	CARD_DETAILS_REQUEST: string;
	MAX_MONTHLY_PROOF_FILES_COUNT: string;
	MONTHLY_PROOF_UPLOADING_TIME: string;
	CRYR_ANDROID_PACKAGE_NAME: string;
	CRYR_ALIAS_NAME: string;
	CRYR_MOBILE_CODE: string;
	STRIPE_AUTO_DEBIT_EXPRESSION: string;
	STRIPE_CASHIER_REQUERY_REQUEST: string;
	UPLOADED_FILE_SIZE: string;
	STRIPE_AUTO_DEBIT_REQUERY_EXPRESSION: string;
	STRIPE_PAYMENT_TYPE_CODE: string;
	STRIPE_DEVICE_TYPE: string;
	STRIPE_ACTION_TYPE: string;
	STRIPE_SUB_TYPE_ID: string;
	STRIPE_TXN_TYPE: string;
	STRIPE_USER_AGENT: string;
	STRIPE_PAYMENT_TYPE_ID: string;
	CASHIER_CLIENT_CODE: string;
	CASHIER_CLIENT_PASSWORD: string;
	CAM_CLIENT_CODE: string;
	CAM_CLIENT_PASSWORD: string;
	STRIPE_PROVIDER_CODE: string;
	STRIPE_PAYMENT_FAILED_ERROR_CODE: string;
	AES_DECRYPTION_IV: string;
	AES_DECRYPTION_KEY: string;
	PLAID_URL: string;
	PLAID_CATEGORY_REQUEST: string;
	CAM_BACKEND_BASE_URL: string;
	UPDATE_CONSUMER_PROFILE_URL: string;
}

export const envSchema: joi.ObjectSchema<EnvConfig> = joi.object({
	ENV: joi.string().required().default("dev"),
	PORT: joi.number(),
	CONTEXT: joi.string().empty("").default(`v1.0`),
	ORIGINS: joi.string().default("*"),
	ALLOWED_HEADERS: joi.string(),
	ALLOWED_METHODS: joi.string(),
	CORS_ENABLED: joi.boolean(),
	CORS_CREDENTIALS: joi.boolean(),

	WRITE_LOG: joi.boolean(),
	MINIMUM_LOG_LEVEL: joi.string(),

	SWAGGER_PATH: joi.string(),
	SWAGGER_ENABLED: joi.boolean(),

	TEST_KEY: joi.string(),

	DB_TYPE: joi.string(),
	DB_HOST: joi.string(),
	DB_PORT: joi.number(),
	DB_USERNAME: joi.string(),
	DB_PASSWORD: joi.string(),
	DB_DATABASE: joi.string(),

	REDIS_HOST: joi.string(),
	REDIS_PORT: joi.number(),

	DB_TYPE_MONGO: joi.string(),
	DB_HOST_MONGO: joi.string(),
	DB_PORT_MONGO: joi.number(),
	DB_USERNAME_MONGO: joi.string().empty(""),
	DB_PASSWORD_MONGO: joi.string().empty(""),
	DB_DATABASE_MONGO: joi.string().empty(""),
	IS_MONGO_ENABLE: joi.boolean(),

	ENCRYPT_DECRYPT_KEY: joi.string(),

	PLAID_SECRET: joi.string(),
	PLAID_CLIENT_ID: joi.string(),

	KAFKA_BROKER: joi.string(),
	KAFKA_GROUP_ID: joi.string(),

	CRON_EXPRESSION: joi.string(),
	SYSTEM_REQUERING_TIME_IN_MILLISECONDS: joi.string(),

	KAFKA_REGISTER_USER_FAILED_EXPRESSION: joi.string(),
	KAFKA_UPDATE_USER_FAILED_EXPRESSION: joi.string(),
	KAFKA_STRIPE_PAYMENT_FAILED_EXPRESSION: joi.string(),
	KAFKA_INVITATION_FAILED_EXPRESSION: joi.string(),
	FETCH_PLAID_DATA_EXPRESSION: joi.string(),
	CHECK_REFDOC_VALIDITY_EXPRESSION: joi.string(),
	UPDATE_CURRENT_DAY_DASHBOARD_DATA_EXPRESSION: joi.string(),
	TAG_PLAID_TXN_EXPRESSION: joi.string(),
	HANDLE_QUALIFIED_MONTHLYPROOFS_EXPRESSION: joi.string(),
	MONTHLY_PROOF_INSERTION_EXPRESSION: joi.string(),
	SCHEDULER_UPDATE_EXPRESSION: joi.string(),
	STRIPE_PAYMENT_URL: joi.string(),
	STRIPE_CASHIER_DEPOSIT_REQUEST: joi.string(),
	STRIPE_GENERATE_TXN_TOKEN: joi.string(),
	CARD_DETAILS_REQUEST: joi.string(),
	CRYR_FRONTEND_BASE_URL: joi.string(),
	CRYR_PAYMENT_REQUEST: joi.string(),
	CRYR_PARTICIPANT_INVITATION: joi.string(),
	MAX_MONTHLY_PROOF_FILES_COUNT: joi.string(),
	MONTHLY_PROOF_UPLOADING_TIME: joi.string(),
	CRYR_ANDROID_PACKAGE_NAME: joi.string(),
	CRYR_ALIAS_NAME: joi.string(),
	CRYR_MOBILE_CODE: joi.string(),
	STRIPE_AUTO_DEBIT_EXPRESSION: joi.string(),
	STRIPE_CASHIER_REQUERY_REQUEST: joi.string(),
	UPLOADED_FILE_SIZE: joi.string(),
	STRIPE_AUTO_DEBIT_REQUERY_EXPRESSION: joi.string(),
	STRIPE_PAYMENT_TYPE_CODE: joi.string(),
	STRIPE_DEVICE_TYPE: joi.string(),
	STRIPE_ACTION_TYPE: joi.string(),
	STRIPE_SUB_TYPE_ID: joi.string(),
	STRIPE_TXN_TYPE: joi.string(),
	STRIPE_USER_AGENT: joi.string(),
	STRIPE_PAYMENT_TYPE_ID: joi.string(),
	CASHIER_CLIENT_CODE: joi.string(),
	CASHIER_CLIENT_PASSWORD: joi.string(),
	CAM_CLIENT_CODE: joi.string(),
	CAM_CLIENT_PASSWORD: joi.string(),
	STRIPE_PROVIDER_CODE: joi.string(),
	STRIPE_PAYMENT_FAILED_ERROR_CODE: joi.string(),
	AES_DECRYPTION_KEY: joi.string(),
	AES_DECRYPTION_IV: joi.string(),
	PLAID_URL: joi.string(),
	PLAID_CATEGORY_REQUEST: joi.string(),
	CAM_BACKEND_BASE_URL: joi.string(),
	UPDATE_CONSUMER_PROFILE_URL: joi.string()
});
