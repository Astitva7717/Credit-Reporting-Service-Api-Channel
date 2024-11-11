class UserdetailModel {
	public UserdetailModel(map) {
		this.systemUserId = map["userId"].toString();
		this.userId = Number(map["userId"].toString());
		this.businessId = Number(map["businessId"].toString());
		this.isHead = map["isHead"].toString();
		this.firstName = map["firstName"].toString();
		this.lastName = map["lastName"].toString();
		this.username = map["username"].toString();
		this.businessName = map["businessName"].toString();
		this.businessCode = map["businessCode"].toString();
		this.userType = map["userTypeCode"].toString();
		this.userStatus = map["userStatus"].toString();
		this.businessStatus = map["businessStatus"].toString();
		this.accessSelfBusinessOnly = map["accessSelfBusinessOnly"].toString();
	}

	userId: number;

	businessId: number;

	isHead: string;

	systemUserId: string;

	firstName: string;

	lastName: string;

	username: string;

	businessName: string;

	businessCode: string;

	userType: string;

	userStatus: string;

	businessStatus: string;

	accessSelfBusinessOnly: string;
}
