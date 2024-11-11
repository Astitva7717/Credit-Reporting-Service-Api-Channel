export const GetArticlesForBackoffice = [
	"blogArticle.articleId as articleId",
	"blogArticle.heading as heading",
	"blogArticle.categoryId as categoryId",
	"blogArticle.status as articleStatus",
	"blogArticle.createdAt as blogCreatedAt",
	"blogArticle.updatedAt as blogUpdatedAt",
	"blogArticle.imageUrl as blogImage",
	"CONCAT(createrUserInfo.first_name,' ',createrUserInfo.last_name) as blogCreatedBy",
	"CONCAT(updateByUserInfo.first_name,' ',updateByUserInfo.last_name) as blogUpdatedBy",
	"statusMaster.description as statusDesc",
	"blogCategory.name as categoryName"
];

export const GetArticles = [
	"blogArticle.articleId as articleId",
	"blogArticle.heading as heading",
	"blogArticle.createdAt as blogCreatedAt",
	"blogArticle.updatedAt as blogUpdatedAt",
	"blogArticle.imageUrl as blogImage",
	"blogArticle.content as content",
	"blogCategory.name as categoryName"
];

export const fetchArticles = [
	"blogArticle.articleId as articleId",
	"blogArticle.heading as heading",
	"blogArticle.imageUrl as blogImage",
	"blogArticle.blogUrl as blogUrl",
	"blogArticle.status as status",
	"blogArticle.createdAt as blogCreatedAt",
	"blogArticle.updatedAt as blogUpdatedAt"
];

export const getBlogArticleByArticleId = [
	"blogArticle.articleId as articleId",
	"blogArticle.heading as heading",
	"blogArticle.content as content",
	"blogArticle.categoryId as categoryId",
	"blogArticle.status as articleStatus",
	"blogArticle.createdAt as blogCreatedAt",
	"blogArticle.updatedAt as blogUpdatedAt",
	"blogArticle.imageUrl as blogImage",
	"blogArticle.blogUrl as blogUrl",
	"CONCAT(createrUserInfo.first_name,' ',createrUserInfo.last_name) as blogCreatedBy",
	"CONCAT(updateByUserInfo.first_name,' ',updateByUserInfo.last_name) as blogUpdatedBy",
	"statusMaster.description as statusDesc",
	"blogCategory.name as categoryName"
];

export const GetMasterProofFilteredData = [
	"validationDocMasterProof.paymentType as paymentType",
	"validationDocMasterProof.masterProofType as masterProofType",
	"validationDocMasterProof.proofIdValue as proofIdValue",
	"validationDocMasterProof.proofPath as proofPath",
	"validationDocMasterProof.proofDetail as proofDetail",
	"validationDocMasterProof.validTill as masterProofValidTill",
	"validationDocMasterProof.status as masterProofStatus",
	"statusMaster.description as statusDesc",
	"validationDocMasterProof.id as masterProofId",
	"validationDocMasterProof.userId as masterProofUserId",
	"validationDocMasterProof.remark as masterProofRemark",
	"validationDocMasterProof.verifiedAt as verifiedAt",
	"validationDocMasterProof.createdAt as createdAt",
	"masterUser.firstName as userFirstName",
	"masterUser.lastName as userLastName",
	"payeeUser.firstName as payeeFirstName",
	"payeeUser.lastName as payeeLastName",
	"rejectionReasons.reason as rejectionReason",
	"mapping.paymentTypeName as paymentTypeName"
];

export const GetRefdocMasterFilteredData = [
	"refdocMaster.validTo as validTo",
	"refdocMaster.status as status",
	"statusMaster.description as statusDesc",
	"refdocMaster.refdocId as id",
	"refdocMaster.displayRefdocId as displayRefdocId",
	"refdocMaster.uploadedDate as uploadedDate",
	"refdocMaster.interimData as interimData",
	"users.emailId as userEmail",
	"users.firstName as userFirstName",
	"users.lastName as userLastName",
	"users.mobileNo as userMobileNumber",
	"users.primaryIdValue as ssnId",
	"refdocType.name as refdocType"
];

export const getRefdocHistoryData = [
	"refdocMasterHistory.historyId as historyId",
	"refdocMasterHistory.status as status",
	"statusMaster.description as historyStatusDesc",
	"refdocMasterHistory.documentPath as documentPath",
	"refdocMasterHistory.approvedDate as approvedDate",
	"refdocMasterHistory.verifiedAt as verifiedAt",
	"refdocMasterHistory.updatedAt as updatedAt",
	"refdocMasterHistory.uploadedDate as uploadedDate",
	"refdocMasterHistory.rejectionCount as rejectionCount",
	"reasonMaster.reason as rejectionReason",
	"CONCAT(user.first_name,' ',user.last_name) as verifiedBy"
];

export const GetMasterProofDataBackoffice = [
	"refdocMaster.validFrom as validFrom",
	"refdocMaster.validTo as validTo",
	"refdocMaster.status as refdocStatus",
	"statusMaster.description as statusDesc",
	"masterProofStatusMaster.description as masterProofStatusDesc",
	"refdocMaster.refdocId as refdocId",
	"refdocMaster.displayRefdocId as displayRefdocId",
	"users.username as username",
	"users.emailId as userEmail",
	"users.firstName as userFirstName",
	"users.lastName as userLastName",
	"users.mobileNo as userMobileNumber",
	"refdocType.name as refdocType",
	"refdocType.logo as refdocLogo",
	"refdocType.serviceCode as serviceCode",
	"count(*) as validationDocRequested"
];

export const TotalMasterProofDocData = [
	"refdocMaster.refdocId as refdocId",
	"refdocMaster.displayRefdocId as displayRefdocId",
	"count(*) as validationDocCount"
];

export const GetUsersAllRefdoc = [
	"refdocMaster.refdocId as refdocId",
	"refdocMaster.displayRefdocId as displayRefdocId",
	"refdocMaster.refdocTypeId as refdocTypeId",
	"refdocMaster.documentPath as documentPath",
	"refdocMaster.firstName as ownerName",
	"COALESCE(refdocMaster.address_one,user.address_one) as addressOne",
	"COALESCE(refdocMaster.address_two,user.address_two) as addressTwo",
	"COALESCE(refdocMaster.city,user.city) as city",
	"COALESCE(refdocMaster.state,user.state_code) as state",
	"COALESCE(refdocMaster.zip,user.zip) as zip",
	"refdocMaster.rejectedReason as rejectedReasonId",
	"rejectionReasons.reason as rejectedReason",
	"refdocMaster.remark as remark",
	"refdocMaster.validFrom as validFrom",
	"refdocMaster.validTo as validTo",
	"refdocMaster.rentDueDay as rentDueDay",
	"refdocMaster.rentPaymentDueDay as rentPaymentDueDay",
	"refdocMaster.rentDueDate as rentDueDate",
	"refdocMaster.rentPaymentDueDate as rentPaymentDueDate",
	"refdocMaster.rentAmount as rentAmount",
	"refdocMaster.baseAmount as baseAmount",
	"refdocMaster.status as status",
	"statusMaster.description as statusDesc",
	"refdocMaster.verifiedBy as verifiedBy",
	"refdocMaster.verifiedAt as verifiedAt",
	"refdocMaster.createdAt as createdAt",
	"'selfRefdocs' as type",
	"refdocMaster.updatedAt as updatedAt",
	"refdocTypeMaster.name as refdocTypeName",
	"refdocTypeMaster.serviceCode as refdocTypeCode"
];

export const GetUserRefdocDataAsParticipant = [
	"refdocMaster.refdocId as refdocId",
	"refdocMaster.displayRefdocId as displayRefdocId",
	"refdocMaster.refdocTypeId as refdocTypeId",
	"refdocMaster.documentPath as documentPath",
	"refdocMaster.firstName as ownerName",
	"COALESCE(refdocMaster.address_one,user.address_one) as addressOne",
	"COALESCE(refdocMaster.address_two,user.address_two) as addressTwo",
	"COALESCE(refdocMaster.city,user.city) as city",
	"COALESCE(refdocMaster.state,user.state) as state",
	"COALESCE(refdocMaster.zip,user.zip) as zip",
	"refdocMaster.rejectedReason as rejectedReasonId",
	"rejectionReasons.reason as rejectedReason",
	"refdocMaster.remark as remark",
	"refdocMaster.validFrom as validFrom",
	"refdocMaster.validTo as validTo",
	"refdocMaster.rentDueDay as rentDueDay",
	"refdocMaster.rentPaymentDueDay as rentPaymentDueDay",
	"refdocMaster.rentDueDate as rentDueDate",
	"refdocMaster.rentPaymentDueDate as rentPaymentDueDate",
	"refdocMaster.rentAmount as rentAmount",
	"refdocMaster.baseAmount as baseAmount",
	"refdocMaster.status as status",
	"statusMaster.description as statusDesc",
	"refdocMaster.verifiedBy as verifiedBy",
	"refdocMaster.verifiedAt as verifiedAt",
	"refdocMaster.createdAt as createdAt",
	"'participant' as type",
	"refdocMaster.updatedAt as updatedAt",
	"refdocTypeMaster.name as refdocTypeName",
	"refdocTypeMaster.serviceCode as refdocTypeCode"
];

export const GetUsersDataAsPaymentRequested = [
	"refdocMaster.refdocId as refdocId",
	"refdocMaster.displayRefdocId as displayRefdocId",
	"refdocMaster.userId as userId",
	"refdocMaster.refdocTypeId as refdocTypeId",
	"refdocMaster.documentPath as documentPath",
	"refdocMaster.firstName as ownerName",
	"COALESCE(refdocMaster.address_one,user.address_one) as addressOne",
	"COALESCE(refdocMaster.address_two,user.address_two) as addressTwo",
	"COALESCE(refdocMaster.city,user.city) as city",
	"COALESCE(refdocMaster.state,user.state) as state",
	"COALESCE(refdocMaster.zip,user.zip) as zip",
	"refdocMaster.rejectedReason as rejectedReasonId",
	"rejectionReasons.reason as rejectedReason",
	"refdocMaster.remark as remark",
	"refdocMaster.validFrom as validFrom",
	"refdocMaster.validTo as validTo",
	"refdocMaster.rentDueDay as rentDueDay",
	"refdocMaster.rentPaymentDueDay as rentPaymentDueDay",
	"refdocMaster.rentDueDate as rentDueDate",
	"refdocMaster.rentPaymentDueDate as rentPaymentDueDate",
	"refdocMaster.rentAmount as rentAmount",
	"refdocMaster.baseAmount as baseAmount",
	"refdocMaster.status as status",
	"statusMaster.description as statusDesc",
	"refdocMaster.verifiedBy as verifiedBy",
	"refdocMaster.verifiedAt as verifiedAt",
	"refdocMaster.createdAt as createdAt",
	"'paymentRequested' as type",
	"refdocMaster.updatedAt as updatedAt",
	"refdocTypeMaster.name as refdocTypeName",
	"refdocTypeMaster.serviceCode as refdocTypeCode"
];

export const MasterProofDataByRefdocIdsAndStatus = [
	"masterproof.id as id",
	"masterproof.userId as userId",
	"masterproof.status as status",
	"masterproof.refdocId as refdocId",
	"masterproof.payeeId as payeeId",
	"mapping.monthlyProofType as monthlyProofType",
	"mapping.paymentTypeName as paymentTypeName"
];

export const RefdocPrimaryUserDetails = [
	"refdocMaster.refdocId as refdocId",
	"refdocMaster.displayRefdocId as displayRefdocId",
	"users.userId as participantUserId",
	"users.emailId as emailId",
	"CONCAT(users.first_name,' ',users.last_name) as name",
	"users.mobileNo as mobile",
	"refdocMaster.createdAt as createdAt",
	"refdocMaster.updatedAt as updatedAt"
];

export const GetMasterProofData = [
	"proof.id AS id",
	"proof.refdocId AS refdocId",
	"proof.proofPath AS proofPath",
	"proof.proofDetail AS proofDetail",
	"proof.masterProofType AS masterProofType",
	"proof.remark AS remark",
	"proof.status AS status",
	"rejectionReasons.reason as rejectedReason",
	"mapping.paymentTypeName as paymentTypeName",
	"statusMaster.description As statusDesc",
	"mapping.paymentType As paymentType",
	"proof.verifiedBy AS verifiedBy",
	"proof.verifiedAt AS verifiedAt",
	"proof.createdAt AS createdAt",
	"proof.updatedAt AS updatedAt"
];

export const RefdocDetailsById = [
	"users.username as username",
	"users.firstName as userFirstName",
	"users.lastName as userLastName",
	"users.middleName as userMiddleName",
	"users.suffixName as userSuffixName",
	"users.emailId as userEmail",
	"users.mobileNo as userMobileNumber",
	"users.primaryIdValue as ssnId",
	"users.channelId as channelId",
	"refdocType.name as refdocType",
	"refdocType.logo as refdocLogo",
	"refdocType.serviceCode as serviceCode",
	"refdocMaster.refdocId as refdocId",
	"refdocMaster.displayRefdocId as displayRefdocId",
	"refdocMaster.userId as userId",
	"refdocMaster.refdocTypeId as refdocTypeId",
	"refdocMaster.documentPath as documentPath",
	"refdocMaster.firstName as firstName",
	"refdocMaster.lastName as lastName",
	"refdocMaster.middleName as middleName",
	"refdocMaster.suffixName as suffixName",
	"refdocMaster.ownerName as ownerName",
	"refdocMaster.propertyName as propertyName",
	"refdocMaster.addressOne as addressOne",
	"refdocMaster.addressTwo as addressTwo",
	"refdocMaster.city as city",
	"refdocMaster.state as state",
	"refdocMaster.zip as zip",
	"refdocMaster.rejectedReason as rejectedReasonId",
	"refdocMaster.remark as remark",
	"refdocMaster.validFrom as validFrom",
	"refdocMaster.validTo as validTo",
	"refdocMaster.rentDueDay as rentDueDay",
	"refdocMaster.rentPaymentDueDay as rentPaymentDueDay",
	"refdocMaster.rentAmount as rentAmount",
	"refdocMaster.baseAmount as baseAmount",
	"refdocMaster.status as status",
	"statusMaster.description as statusDesc",
	"refdocMaster.verifiedBy as verifiedBy",
	"refdocMaster.verifiedAt as verifiedAt",
	"refdocMaster.uploadedDate as uploadedDate",
	"refdocMaster.approvedDate as approvedDate",
	"refdocMaster.variableComponentLease as variableComponentLease",
	"refdocMaster.interimData as interimData",
	"rejectionReasons.reason as rejectionReason"
];

export const RefdocParticipantDetails = [
	"users.userId as participantUserId",
	"users.emailId as emailId",
	"users.mobileNo as mobileNo",
	"users.firstName as firstName",
	"users.lastName as lastName",
	"refdocParticipants.isPrimary as isPrimary"
];

export const GetPaymentSchedule = [
	"paymentSchedule.id AS id",
	"paymentSchedule.leaseId AS leaseId",
	"paymentSchedule.month AS reportingMonth",
	"paymentSchedule.year AS reportingYear",
	"paymentSchedule.dueDate AS dueDate",
	"paymentSchedule.paymentDueDate AS paymentDueDate",
	"paymentSchedule.amount AS amount",
	"paymentSchedule.status AS status",
	"paymentSchedule.modifiedAmount AS modifiedAmount",
	"paymentSchedule.notes AS notes",
	"statusMaster.description AS statusDesc",
	"paymentSchedule.createdAt AS createdAt",
	"paymentSchedule.updatedAt AS updatedAt"
];

export const GetPaymentScheduleByMonthAndYear = [
	"paymentSchedule.id AS id",
	"paymentSchedule.leaseId AS leaseId",
	"paymentSchedule.month AS month",
	"paymentSchedule.year AS year",
	"paymentSchedule.dueDate AS dueDate",
	"paymentSchedule.paymentDueDate AS paymentDueDate",
	"paymentSchedule.amount AS amount",
	"paymentSchedule.status AS status",
	"paymentSchedule.modifiedAmount AS modifiedAmount",
	"paymentSchedule.notes AS notes",
	"statusMaster.description AS statusDesc",
	"paymentSchedule.createdAt AS createdAt",
	"paymentSchedule.updatedAt AS updatedAt"
];

export const getOlderPaymentSchedule = [
	"paymentSchedule.id AS id",
	"paymentSchedule.leaseId AS leaseId",
	"paymentSchedule.dueDate AS dueDate",
	"paymentSchedule.paymentDueDate AS paymentDueDate",
	"paymentSchedule.amount AS amount",
	"userPaymentSchedule.status AS status",
	"paymentSchedule.modifiedAmount AS modifiedAmount",
	"paymentSchedule.notes AS notes",
	"statusMaster.description AS statusDesc",
	"paymentSchedule.createdAt AS createdAt",
	"paymentSchedule.updatedAt AS updatedAt"
];

export const PaymentScheduleForRent = [
	"PaymentSchedule.leaseId as leaseId",
	"PaymentSchedule.id as id",
	"PaymentSchedule.dueDate as dueDate",
	"PaymentSchedule.paymentDueDate as paymentDueDate"
];

export const DocMonthlyProofByTypeAndStatus = [
	"refdocType.name as refdocType",
	"refdocType.logo as refdocLogo",
	"refdocType.serviceCode as serviceCode",
	"refdocMaster.refdocId as refdocId",
	"refdocMaster.displayRefdocId as displayRefdocId",
	"users.userId as customerId",
	"users.firstName as userFirstName",
	"users.lastName as userLastName",
	"monthlyProof.reportingDuration as reportingDuration",
	"monthlyProof.reportingMonth as reportingMonth",
	"monthlyProof.reportingYear as reportingYear",
	"monthlyProof.status as monthlyProofStatus",
	"statusMaster.description as statusDesc",
	"monthlyProof.id as monthlyProofId",
	"masterProof.paymentType as paymentType",
	"masterProof.id as masterProofId",
	"paymentdocMapping.paymentTypeName as paymentTypeName",
	"users.emailId as userEmail",
	"users.mobileNo as userMobileNumber",
	"users.primaryIdValue as ssnId"
];

export const GetmonthlyProofDetailsById = [
	"monthlyProof.reportingDuration as reportingDuration",
	"monthlyProof.reportingMonth as reportingMonth",
	"monthlyProof.reportingYear as reportingYear",
	"monthlyProof.status as monthlyProofStatus",
	"statusMaster.description as statusDesc",
	"monthlyProof.id as monthlyProofId",
	"monthlyProof.proofPath as monthlyProofPath",
	"monthlyProof.transactionDate as transactionDate",
	"monthlyProof.proofDetail as monthlyProofDetail",
	"monthlyProof.fiRefNo as transacationId",
	"monthlyProof.amount as amount",
	"monthlyProof.rejectedReason as rejectedReason",
	"monthlyProof.monthlyProofType as monthlyProofType",
	"monthlyProof.disputeId as disputeId",
	"monthlyProof.remark as remark",
	"rejectionReasons.reason as monthlyProofRejectedReason"
];

export const MonthlyProofFullDetails = [
	"refdocType.name as refdocType",
	"refdocType.serviceCode as serviceCode",
	"refdocMaster.refdocId as refdocId",
	"refdocMaster.displayRefdocId as displayRefdocId",
	"refdocMaster.documentPath as documentPath",
	"refdocMaster.ownerName as ownerName",
	"refdocMaster.address_one as address_one",
	"refdocMaster.address_two as address_two",
	"refdocMaster.city as city",
	"refdocMaster.state as state",
	"refdocMaster.zip as zip",
	"refdocMaster.validFrom as validFrom",
	"refdocMaster.validTo as validTo",
	"refdocMaster.rentDueDay as rentDueDay",
	"refdocMaster.rentPaymentDueDay as rentPaymentDueDay",
	"refdocMaster.rentAmount as rentAmount",
	"refdocMaster.approvedDate as approvedDate",
	"refdocMaster.uploadedDate as uploadedDate",
	"refdocMaster.status as refdocStatus",
	"refdocMaster.creditors as creditors",
	"refdocStatusMaster.description as refdocStatusDesc",
	"refdocMaster.verifiedAt as verifiedAt",
	"primaryUser.userId as primaryUserId",
	"primaryUser.firstName as primaryUserFirstName",
	"primaryUser.emailId as primaryUserEmail",
	"primaryUser.mobileNo as primaryUserMobileNo",
	"primaryUser.mobileCode as primaryUserMobileCode",
	"primaryUser.lastName as primaryUserLastName",
	"primaryUser.middleName as primaryUserMiddleName",
	"primaryUser.suffixName as primaryUserSuffixName",
	"masterUser.firstName as masterUserFirstName",
	"masterUser.lastName as masterUserLastName",
	"masterUser.middleName as masterUserMiddleName",
	"masterUser.suffixName as masterUserSuffixName",
	"masterProof.id as masterProofId",
	"masterProof.paymentType as paymentType",
	"masterProof.proofDetail as masterProofDetail",
	"masterProof.masterProofType as masterProofType",
	"monthlyProof.reportingMonth as reportingMonth",
	"monthlyProof.reportingYear as reportingYear",
	"monthlyProof.status as monthlyProofStatus",
	"monthlyStatusMaster.description as monthlyProofStatusDesc",
	"monthlyProof.id as monthlyProofId",
	"monthlyProof.proofPath as monthlyProofPath",
	"monthlyProof.receipt as monthlyProofReceipt",
	"monthlyProof.proofDetail as monthlyProofDetail",
	"monthlyProof.fiRefNo as monthlyProofTxnId",
	"monthlyProof.amount as monthlyProofAmount",
	"monthlyProof.remark as monthlyProofRemark",
	"monthlyProof.transactionDate as transactionDate",
	"monthlyProof.verifiedBy as monthlyProofVerifiedBy",
	"monthlyProof.disputeId as disputeId",
	"verifyUser.firstName as verifyUserFirstName",
	"verifyUser.lastName as verifyUserLastName",
	"verifyUser.middleName as verifyUserMiddleName",
	"verifyUser.suffixName as verifyUserSuffixName",
	"paymentdocMapping.paymentTypeName as paymentTypeName",
	"rejectionReasons.reason as monthlyProofRejectedReason",
	"masterUser.channelId as channelId",
	"schedule.paymentDueDate as paymentDueDate",
	"schedule.dueDate as dueDate",
	"schedule.status as scheduleStatus",
	"scheduleStatusMaster.description as scheduleStatusDesc"
];

export const GetPlaidTxnsData = [
	"refdoc.refdocId as refdocId",
	"refdoc.displayRefdocId as displayRefdocId",
	"refdoc.documentPath as documentPath",
	"refdoc.ownerName as ownerName",
	"refdoc.address_one as address_one",
	"refdoc.address_two as address_two",
	"refdoc.city as city",
	"refdoc.state as state",
	"refdoc.zip as zip",
	"refdoc.validFrom as validFrom",
	"refdoc.validTo as validTo",
	"refdoc.rentDueDay as rentDueDay",
	"refdoc.rentPaymentDueDay as rentPaymentDueDay",
	"refdoc.rentAmount as rentAmount",
	"refdoc.status as refdocStatus",
	"refdoc.creditors as creditors",
	"refdocStatusMaster.description as refdocStatusDesc"
];

export const RefdocPaymentWiseTotalRentPaid = [
	"masterProof.paymentType as paymentType",
	"masterProof.proofPath as masterProofPath",
	"masterProof.proofDetail as masterProofDetail",
	"masterProof.masterProofType as masterProofType",
	"paymentValidationDocMapping.paymentTypeName as paymentTypeName",
	"verifiedProofs.id as verifiedProofId",
	"verifiedProofs.status as status",
	"verifiedProofs.proofPath as verifiedProofPath",
	"verifiedProofs.proofDetail as verifiedProofDetail",
	"verifiedProofs.fiRefNo as verifiedProofTxnId",
	"verifiedProofs.approvedAmount as verifiedProofAmount",
	"verifiedProofs.transactionDate as transactionDate",
	"verifiedProofs.verifiedBy as monthlyProofVerifiedBy",
	"verifyUser.firstName as verifyUserFirstName",
	"verifyUser.lastName as verifyUserLastName",
	"verifyUser.middleName as verifyUserMiddleName",
	"verifyUser.suffixName as verifyUserSuffixName"
];

export const GetVerifiedProofs = [
	"masterProof.paymentType as paymentType",
	"paymentValidationDocMapping.paymentTypeName as paymentTypeName",
	"paymentValidationDocMapping.imageUrl as iconUrl",
	"verifiedProofs.id as verifiedProofId",
	"verifiedProofs.transactionDate as transactionDate",
	"verifiedProofs.approvedAmount as approvedAmount",
	"verifiedProofs.fiRefNo as transactionId",
	"CONCAT(payeeUser.first_name,' ',payeeUser.last_name) as payeeName"
];

export const getMonthlyProofsOfPayeeByRefdocId = [
	"monthlyProof.id as monthlyProofId",
	"paymentValidationDocMapping.paymentTypeName as paymentTypeName",
	"paymentValidationDocMapping.paymentType as paymentType",
	"monthlyProof.proofPath as proofPath",
	"monthlyProof.receipt as receipt",
	"monthlyProof.proofDetail as proofDetail",
	"monthlyProof.fiRefNo as fiRefNo",
	"monthlyProof.amount as amount",
	"monthlyProof.reportingMonth as reportingMonth",
	"monthlyProof.reportingYear as reportingYear",
	"monthlyProof.disputeId as disputeId",
	"monthlyProof.status as monthlyProofStatus",
	"monthlyStatusMaster.description as monthlyProofStatusDesc",
	"rejectionReasonMaster.reason as rejectedReason",
	"monthlyProof.remark as remark",
	"monthlyProof.verifiedAt as verifiedAt",
	"monthlyProof.createdAt as createdAt",
	"monthlyProof.updatedAt as updatedAt",
	"monthlyProof.monthlyProofType as monthlyProofType"
];

export const getMonthlyProofNameByMasterProofId = ["paymentValidationDocMapping.paymentTypeName as docType"];

export const UserMonthlyProofsForRefdoc = [
	"masterProof.paymentType as paymentType",
	"masterProof.proofPath as masterProofPath",
	"masterProof.proofDetail as masterProofDetail",
	"masterProof.validTill as masterProofValidTill",
	"masterProof.status as masterProofStatus",
	"monthlyProof.reportingMonth as reportingMonth",
	"monthlyProof.reportingYear as reportingYear",
	"monthlyProof.status as monthlyProofStatus",
	"monthlyProof.id as monthlyProofId",
	"monthlyProof.proofPath as monthlyProofPath",
	"monthlyProof.proofDetail as monthlyProofDetail",
	"monthlyProof.fiRefNo as monthlyProofFiRefNo",
	"monthlyProof.amount as monthlyProofAmount"
];

export const PlaidMonthlyProofDataByStatus = [
	"plaidLinkTokens.accessToken as accessToken",
	"masterProof.paymentType as paymentType",
	"masterProof.proofIdValue as proofIdValue",
	"masterProof.refdocId as refdocId",
	"monthlyProof.id as monthlyProofId",
	"monthlyProof.status as monthlyProofStatus",
	"monthlyProof.reportingMonth as reportingMonth",
	"monthlyProof.reportingYear as reportingYear",
	"monthlyProof.lastFetchDate as lastFetchDate"
];

export const UsersLastValidTill = [
	"transaction.id as id",
	"transaction.price as price",
	"transaction.renewalMonth as lastRenewalMonth",
	"transaction.paymentType as paymentType"
];

export const GetSubscriptionTransactionData = [
	"transaction.id AS id",
	"transaction.packageId AS packageId",
	"transaction.userId AS userId",
	"transaction.benificiaryUserId AS benificiaryUserId",
	"transaction.paymentType AS paymentType",
	"transaction.refdocId AS refdocId",
	"transaction.renewalMonth AS renewalMonth",
	"transaction.autoRenewal AS autoRenewal",
	"transaction.price AS price",
	"transaction.paymentMethodId AS paymentMethodId",
	"transaction.paymentAmount AS paymentAmount",
	"transaction.validTill AS validTill",
	"transaction.referenceId AS referenceId",
	"transaction.status AS status",
	"statusMaster.description AS statusDesc",
	"transaction.createdAt AS createdAt",
	"transaction.updatedAt AS updatedAt"
];

export const PaymentHistoryData = [
	"transaction.refdocId as refdocId",
	"transaction.userId as userId",
	"transaction.benificiaryUserId as benificiaryUserId",
	"transaction.packageId as packageId",
	"packages.code as packageCode",
	"transaction.renewalMonth as renewalMonth",
	"transaction.autoRenewal as autoRenewal",
	"transaction.paymentMethodId as paymentMethodId",
	"transaction.paymentAmount as paymentAmount",
	"users.addressOne as addressOneB",
	"users.addressTwo as addressTwoB",
	"users.city as cityB",
	"users.state as stateB",
	"users.zip as zipB",
	"refdoc.addressOne as addressOne",
	"refdoc.addressTwo as addressTwo",
	"refdoc.city as city",
	"stateMaster.name as state",
	"refdoc.zip as zip"
];

export const RequestedParticipantData = [
	"id",
	"ParticipantMapRequest.userId as userId",
	"ParticipantMapRequest.participantUserId as requestUserId",
	"ParticipantMapRequest.name as name",
	"ParticipantMapRequest.emailId as emailId",
	"ParticipantMapRequest.mobile as mobile",
	"ParticipantMapRequest.verificationCode as verificationCode",
	"ParticipantMapRequest.refdocId as refdocId",
	"ParticipantMapRequest.status as status"
];

export const PaymentRequestedParticipantData = [
	"id",
	"PaymentUsersMappingRequest.userId as userId",
	"PaymentUsersMappingRequest.payeeUserId as requestUserId",
	"PaymentUsersMappingRequest.payeeUsername as name",
	"PaymentUsersMappingRequest.emailId as emailId",
	"PaymentUsersMappingRequest.mobile as mobile",
	"PaymentUsersMappingRequest.verificationCode as verificationCode",
	"PaymentUsersMappingRequest.refdocId as refdocId",
	"PaymentUsersMappingRequest.status as status"
];

export const GetPlaidData = [
	"MasterProof.id as masterProofId",
	"MasterProof.refdocId as refdocId",
	"MasterProof.proofDetail as proofDetail",
	"RefdocMaster.documentPath as documentPath",
	"RefdocMaster.validFrom as validFrom",
	"RefdocMaster.validTo as validTo",
	"CONCAT(COALESCE(RefdocMaster.addressOne,user.address_one),', ',COALESCE(RefdocMaster.addressTwo,user.address_two)) as address",
	"COALESCE(RefdocMaster.city,user.city) as city",
	"COALESCE(RefdocMaster.state,user.state_code) as state",
	"COALESCE(RefdocMaster.zip,user.zip) as zip",
	"RefdocMaster.status as status"
];

export const GetDisputesFilteredData = [
	"disputeEntity.disputeId as disputeId",
	"disputeEntity.status as disputeStatus",
	"disputeStatusMaster.description as disputeStatusDesc",
	"disputeEntity.createdAt as disputeCreatedAt",
	"disputeEntity.updatedAt as disputeUpdatedAt",
	"disputeEntity.reportingMonth as reportingMonth",
	"disputeEntity.reportingYear as reportingYear",
	"paymentdocMapping.paymentTypeName as paymentTypeName",
	"refdocType.name as refdocType",
	"CONCAT(users.first_name,' ',users.last_name) as raisedBy",
	"disputeType.type as disputeType",
	"users.emailId as userEmail",
	"users.mobileNo as userMobileNumber",
	"schedule.status as monthlyProofStatus"
];

export const getDisputeDataById = [
	"dispute.disputeId as disputeId",
	"dispute.masterProofId as masterProofId",
	"dispute.disputeType as disputeType",
	"dispute.status as disputeStatus",
	"statusMaster.description as statusDesc",
	"dispute.createdAt as raisedAt",
	"dispute.updatedAt as disputeUpdatedAt",
	"dispute.raisedBy as raisedById",
	"disputeType.type as disputeType",
	"CONCAT(users.first_name,' ',users.last_name) as raisedBy",
	"refdocMaster.refdocId as refdocId",
	"refdocMaster.displayRefdocId as displayRefdocId",
	"dispute.reportingMonth as reportingMonth",
	"dispute.reportingYear as reportingYear",
	"masterProof.proofDetail as proofDetail",
	"paymentdocMapping.paymentTypeName as paymentTypeName",
	"paymentdocMapping.paymentType as paymentType",
	"refdocType.name as refdocType",
	"users.emailId as emailId",
	"users.mobileNo as mobileNo",
	"users.createdAt as customerSince",
	"schedule.status as monthlyProofStatus",
	"statusMasterNew.description as monthlyProofStatusDesc",
	"disputeType.type as reason"
];

export const getDisputeHistoryByDisputeId = [
	"disputeHistory.id as id",
	"disputeHistory.comment as comment",
	"disputeHistory.docUrl as docUrl",
	"disputeHistory.docReceipt as docReceipt",
	"disputeHistory.docStatus as docStatus",
	"disputeHistory.docRejectionRemark as docRejectionRemark",
	"disputeHistory.createdAt as createdAt",
	"disputeHistory.createdBy as createdById",
	"CONCAT(users.first_name,' ',users.last_name) as createdBy"
];

export const monthlyProofDataAndRefdocId = [
	"masterProof.refdocId as refdocId",
	"monthlyProof.reportingMonth as reportingMonth",
	"monthlyProof.reportingYear as reportingYear"
];

export const GetMonthlyProofTotalAmount = ["SUM(monthlyProof.amount) as amount"];

export const getDisputeDataByRefdocIdAndRaisedById = [
	"dispute.disputeId as disputeId",
	"dispute.status as disputeStatus",
	"statusMaster.description as statusDesc",
	"dispute.createdAt as disputeCreatedAt",
	"dispute.updatedAt as disputeLastUpdatedAt",
	"dispute.reportingMonth as reportingMonth",
	"dispute.reportingYear as reportingYear",
	"CONCAT(user.first_name,' ',user.last_name) as raisedBy"
];

export const getDisputeFullDetailsFromDisputeHistoryId = [
	"dispute.disputeId as disputeId",
	"dispute.status as disputeStatus",
	"dispute.reportingMonth as reportingMonth",
	"dispute.reportingYear as reportingYear",
	"dispute.reportingYear as reportingYear",
	"disputeHistory.docUrl as docUrl",
	"masterProof.id as masterProofId",
	"masterProof.userId as userId",
	"paymentdocMapping.monthlyProofType as monthlyProofType",
	"paymentdocMapping.paymentType as paymentType"
];

export const GetRefdocTypes = [
	"refdocMaster.refdocId as refdocId",
	"refdocMaster.displayRefdocId as displayRefdocId",
	"refdocTypeMaster.name as refdocType"
];

export const GetDueDateForMasterproof = [
	"masterProof.userId as userId",
	"masterProof.id as masterProofId",
	"masterProof.firstFetchFrom as firstFetchFrom",
	"mapping.monthlyProofType as monthlyProofType",
	"mapping.paymentTypeName as paymentTypeName",
	"masterProof.refdocId as refdocId",
	"masterProof.payeeId as payeeId"
];

export const getUserMasterProofDataAsPayeeForRefdoc = [
	"masterProof.id as masterProofId",
	"masterProof.masterProofType as masterProofType",
	"mapping.paymentTypeName as paymentTypeName"
];

export const GetUserSearchInfo = [
	"users.userId as userId",
	"CONCAT(users.first_name,' ',users.last_name) as name",
	"users.emailId as emailId",
	"users.createdAt as registrationDate",
	"users.mobileNo as mobileNo",
	"users.status as status",
	"statusMaster.description as statusDesc"
];

export const GetBackOfficeUserPermissionsInfo = [
	"users.userId as userId",
	"CONCAT(users.first_name,' ',users.last_name) as name",
	"piiData.ssn as ssn",
	"piiData.email as email",
	"piiData.phone as phone"
];

export const getMasterProofsFullDetailsByRefdocIds = [
	"masterProofs.id as masterProofId",
	"masterProofs.plaidTokenId as plaidTokenId",
	"masterProofs.paymentType as paymentType",
	"masterProofs.proofPath as proofPath",
	"masterProofs.proofDetail as proofDetail",
	"masterProofs.userId as participantUserId",
	"masterProofs.payeeId as payeeUserId",
	"masterProofs.verifiedAt as verifiedAt",
	"masterProofs.createdAt as uploadedAt",
	"masterProofs.status as proofStatus",
	"CONCAT(participantUser.first_name,' ',participantUser.last_name) as participantUserName",
	"CONCAT(payeeUser.first_name,' ',payeeUser.last_name) as payeeUserName",
	"paymentTypeMapping.paymentTypeName as paymentTypeName"
];

export const getRefdocParticipantsByRefdocIds = [
	"refdocMaster.refdocId as refdocId",
	"refdocMaster.displayRefdocId as displayRefdocId",
	"refdocMaster.refdocTypeId as refdocTypeId",
	"refdocMaster.documentPath as documentPath",
	"refdocMaster.uploadedDate as uploadedDate",
	"refdocMaster.approvedDate as approvedDate",
	"refdocMaster.verifiedAt as verifiedAt",
	"refdocMaster.status as status",
	"refdocMaster.addressOne as addressOne",
	"refdocMaster.addressTwo as addressTwo",
	"refdocMaster.city as city",
	"refdocMaster.state as state",
	"refdocMaster.zip as zip",
	"refdocType.name as refdocTypeName",
	"refdocParticipants.userId as userId",
	"refdocParticipants.isPrimary as isPrimary",
	"statusMaster.description as refdocStatusDesc"
];

export const GetParticipantsDataByRefdocIds = [
	"request.id as id",
	"request.userId as userId",
	"request.participantUserId as participantUserId",
	"request.name as name",
	"request.emailId as emailId",
	"request.mobile as mobile",
	"request.rejectionReasonId as rejectionReasonId",
	"request.paymentBy as paymentby",
	"request.refdocId as refdocId",
	"request.packageId as paymentId",
	"request.actionType as actionType",
	"request.status as status",
	"request.verificationCode as verificationCode",
	"statusMaster.description as statusDesc",
	"request.createdAt",
	"request.updatedAt"
];

export const getMasterProofDataForRefdoc = [
	"validationDocMasterProof.paymentType as paymentType",
	"validationDocMasterProof.masterProofType as masterProofType",
	"validationDocMasterProof.proofIdValue as proofIdValue",
	"validationDocMasterProof.proofPath as proofPath",
	"validationDocMasterProof.proofDetail as proofDetail",
	"validationDocMasterProof.validTill as masterProofValidTill",
	"validationDocMasterProof.status as masterProofStatus",
	"statusMaster.description as statusDesc",
	"validationDocMasterProof.id as masterProofId",
	"validationDocMasterProof.userId as masterProofUserId",
	"validationDocMasterProof.remark as masterProofRemark",
	"validationDocMasterProof.verifiedAt as verifiedAt",
	"validationDocMasterProof.createdAt as createdAt",
	"validationDocMasterProof.refdocId as refdocId",
	"CONCAT(masterUser.first_name,' ',masterUser.last_name) as tenantName",
	"CONCAT(payeeUser.first_name,' ',payeeUser.last_name) as payeeName",
	"rejectionReasons.reason as rejectionReason",
	"mapping.paymentTypeName as paymentTypeName"
];

export const GetAmountApproved = [
	"CONCAT(tenantUser.first_name,' ',tenantUser.last_name) as tenantName",
	"CONCAT(payeeUser.first_name,' ',payeeUser.last_name) as payeeName",
	"tenantUser.userId as userId",
	"paymentMapping.paymentTypeName as paymentTypeName",
	"verifiedProofs.proofPath as monthlyProofDoc",
	"verifiedProofs.fiRefNo as transactionIds ",
	"verifiedProofs.approvedAmount as amount",
	"verifiedProofs.reportingYear as reportingYear",
	"verifiedProofs.reportingMonth as reportingMonth"
];

export const getMasterProofDataByRefdocIdMonthYearWithMonthlyData = [
	"masterProof.id as masterProofId",
	"masterProof.masterProofType as masterProofType",
	"masterProof.proofDetail as proofDetail",
	"paymentValidationDocMapping.paymentTypeName as paymentTypeName",
	"MIN(monthlyProof.id) as monthlyProofId"
];

export const getMasterProofDataByRefdocIdMonthYearWithDisputeData = [
	"masterProof.id as masterProofId",
	"masterProof.masterProofType as masterProofType",
	"masterProof.proofDetail as proofDetail",
	"paymentValidationDocMapping.paymentTypeName as paymentTypeName",
	"MIN(dispute.disputeId) as disputeId"
];

export const GetUserInfo = [
	"user.userId as userId",
	"user.businessId as businessId",
	"user.channelId as channelId",
	"user.aliasId as aliasId",
	"user.systemUserId as systemUserId",
	"user.userType as userType",
	"user.mobileCode as mobileCode",
	"user.mobileNo as mobileNo",
	"user.username as username",
	"user.emailId as emailId",
	"user.firstName as firstName",
	"user.middleName as middleName",
	"user.lastName as lastName",
	"user.vipLevelId as vipLevelId",
	"user.addressOne as addressOne",
	"user.addressTwo as addressTwo",
	"user.cityCode as cityCode",
	"user.city as city",
	"user.stateCode as stateCode",
	"user.state as state",
	"user.countryCode as countryCode",
	"user.country as country",
	"user.zip as zip",
	"user.currencyCode as currencyCode",
	"user.primaryIdValue as primaryIdValue",
	"user.status as status",
	"user.dateOfBirth as dateOfBirth",
	"user.emailVerified as emailVerified",
	"user.mobileVerified as mobileVerified",
	"user.createdAt as createdAt",
	"user.updatedAt as updatedAt"
];

export const GetUserInfoWithStatusDesc = [
	"user.userId as userId",
	"user.businessId as businessId",
	"user.channelId as channelId",
	"user.aliasId as aliasId",
	"user.systemUserId as systemUserId",
	"user.userType as userType",
	"user.mobileCode as mobileCode",
	"user.mobileNo as mobileNo",
	"user.username as username",
	"user.emailId as emailId",
	"user.firstName as firstName",
	"user.middleName as middleName",
	"user.lastName as lastName",
	"user.vipLevelId as vipLevelId",
	"user.addressOne as addressOne",
	"user.addressTwo as addressTwo",
	"user.cityCode as cityCode",
	"user.city as city",
	"user.stateCode as stateCode",
	"user.state as state",
	"user.countryCode as countryCode",
	"user.country as country",
	"user.zip as zip",
	"user.currencyCode as currencyCode",
	"user.primaryIdValue as primaryIdValue",
	"user.status as status",
	"user.dateOfBirth as dateOfBirth",
	"user.emailVerified as emailVerified",
	"user.ssnVerified as ssnVerified",
	"user.mobileVerified as mobileVerified",
	"user.createdAt as createdAt",
	"user.refDocParticipant as refDocParticipant",
	"user.updatedAt as updatedAt",
	"user.payDocParticipant as payDocParticipant",
	"user.veriDocParticipant as veriDocParticipant",
	"statusMaster.description as statusDesc"
];

export const GetRefdocFullDetailById = [
	"refdocMaster.refdocId as refdocId",
	"refdocMaster.displayRefdocId as displayRefdocId",
	"refdocMaster.refdocTypeId as refdocTypeId",
	"refdocMaster.documentPath as documentPath",
	"CONCAT(refdocMaster.first_name,' ',refdocMaster.middle_name,' ',refdocMaster.last_name) as ownerName",
	"COALESCE(refdocMaster.address_one,user.address_one) as addressOne",
	"COALESCE(refdocMaster.address_two,user.address_two) as addressTwo",
	"COALESCE(refdocMaster.city,user.city) as city",
	"COALESCE(refdocMaster.state,user.state_code) as state",
	"COALESCE(refdocMaster.zip,user.zip) as zip",
	"refdocMaster.rejectedReason as rejectedReasonId",
	"rejectionReasons.reason as rejectedReason",
	"refdocMaster.remark as remark",
	"refdocMaster.validFrom as validFrom",
	"refdocMaster.validTo as validTo",
	"refdocMaster.rentDueDay as rentDueDay",
	"refdocMaster.rentPaymentDueDay as rentPaymentDueDay",
	"refdocMaster.rentDueDate as rentDueDate",
	"refdocMaster.rentPaymentDueDate as rentPaymentDueDate",
	"refdocMaster.rentAmount as rentAmount",
	"refdocMaster.baseAmount as baseAmount",
	"refdocMaster.status as status",
	"statusMaster.description as statusDesc",
	"refdocMaster.verifiedBy as verifiedBy",
	"refdocMaster.verifiedAt as verifiedAt",
	"refdocMaster.createdAt as createdAt",
	"refdocMaster.updatedAt as updatedAt",
	"refdocMaster.uploadedDate as uploadedDate",
	"refdocTypeMaster.name as refdocTypeName",
	"refdocTypeMaster.serviceCode as refdocTypeCode"
];

export const GetUserInfoByRefdocId = ["user.channelId as channelId, user.businessId as businessId"];

export const getUserPaymentScheduleForMonthYearRefdocId = ["userPaymentSchedule.id as id"];

export const getUserPaymentSchedulesBeforeDueDate = [
	"userPaymentSchedule.id as id",
	"userPaymentSchedule.month as month",
	"userPaymentSchedule.year as year",
	"userPaymentSchedule.refScheduleId as refScheduleId"
];

export const GetUserInfoOfRefdocUsersByRefdocIds = [
	"refdocUsers.refdocId as refdocId",
	"refdocUsers.tenantId as tenantId",
	"refdocUsers.paydocUserId as paydocUserId",
	"refdocUsers.veridocUserId as veridocUserId",
	"CONCAT(tenantMasterUser.first_name,' ',tenantMasterUser.last_name) as tenantUserName",
	"CONCAT(paydocMasterUser.first_name,' ',paydocMasterUser.last_name) as paydocUserName",
	"CONCAT(veridocMasterUser.first_name,' ',veridocMasterUser.last_name) as veridocUserName"
];

export const GetRefdocTypeByPackageId = ["refdocType.serviceCode as serviceCode"];

export const GetRefdocUsersWithUserInfos = [
	"refdocUsers.veridocUserId as veridocUserId",
	"refdocUsers.paydocUserId as paydocUserId",
	"CONCAT(paydocUser.first_name,' ',paydocUser.last_name) as paydocName",
	"CONCAT(veridocUser.first_name,' ',veridocUser.last_name) as veridocName"
];

export const getPlaidMonthlyProofDataForLookBack = [
	"plaidLinkTokens.accessToken as accessToken",
	"masterProof.proofIdValue as proofIdValue",
	"masterProof.refdocId as refdocId",
	"monthlyProof.id as monthlyProofId",
	"monthlyProof.status as monthlyProofStatus",
	"monthlyProof.reportingMonth as reportingMonth",
	"monthlyProof.reportingYear as reportingYear",
	"monthlyProof.lastFetchDate as lastFetchDate"
];

export const GetMasterProofIdReportingMonthYearByStatus = [
	"monthlyProof.masterProofId as masterProofId",
	"monthlyProof.reportingYear as reportingYear",
	"monthlyProof.reportingMonth as reportingMonth"
];

export const GetRefdocPlaidData = ["masterProof.refdocId as refdocId", "masterProof.id as masterProofId"];

export const GetPlaidMasterProofs = [
	"plaidLinkTokens.accessToken as accessToken",
	"masterProof.paymentType as paymentType",
	"masterProof.proofIdValue as proofIdValue",
	"masterProof.refdocId as refdocId",
	"masterProof.id as masterProofId",
	"masterProof.fetchFrom as fetchFrom",
	"masterProof.firstFetchFrom as firstFetchFrom"
];

export const GetCreditorPayPlaidData = [
	"refdoc.refdocId as refdocId",
	"refdoc.displayRefdocId as displayRefdocId",
	"refdoc.documentPath as documentPath",
	"refdoc.ownerName as ownerName",
	"refdoc.address_one as address_one",
	"refdoc.address_two as address_two",
	"refdoc.city as city",
	"refdoc.state as state",
	"refdoc.zip as zip",
	"refdoc.validFrom as validFrom",
	"refdoc.validTo as validTo",
	"refdoc.rentDueDay as rentDueDay",
	"refdoc.rentPaymentDueDay as rentPaymentDueDay",
	"refdoc.rentAmount as rentAmount",
	"refdoc.approvedDate as approvedDate",
	"refdoc.uploadedDate as uploadedDate",
	"refdoc.status as refdocStatus",
	"refdoc.creditors as creditors",
	"statusMaster.description as refdocStatusDesc",
	"refdoc.verifiedAt as verifiedAt",
	"users.userId as userId",
	"users.businessId as businessId",
	"users.channelId as channelId",
	"users.aliasId as aliasId",
	"users.systemUserId as systemUserId",
	"users.userType as userType",
	"users.mobileCode as mobileCode",
	"users.mobileNo as mobileNo",
	"users.username as username",
	"users.emailId as emailId",
	"users.firstName as firstName",
	"users.middleName as middleName",
	"users.lastName as lastName",
	"users.vipLevelId as vipLevelId",
	"users.addressOne as addressOne",
	"users.addressTwo as addressTwo",
	"users.cityCode as cityCode",
	"users.city as city",
	"users.stateCode as stateCode",
	"users.state as state",
	"users.countryCode as countryCode",
	"users.country as country",
	"users.zip as zip",
	"users.currencyCode as currencyCode",
	"users.primaryIdValue as primaryIdValue",
	"users.status as status",
	"users.dateOfBirth as dateOfBirth",
	"users.emailVerified as emailVerified",
	"users.ssnVerified as ssnVerified",
	"users.mobileVerified as mobileVerified",
	"users.createdAt as createdAt",
	"users.refDocParticipant as refDocParticipant",
	"users.updatedAt as updatedAt",
	"users.payDocParticipant as payDocParticipant",
	"users.veriDocParticipant as veriDocParticipant"
];