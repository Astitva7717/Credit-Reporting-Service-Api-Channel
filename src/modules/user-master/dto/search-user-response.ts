export class UserSearchResponse {
	userId: number;
	aliasId: number;
	aliasName: string;
	systemUserId: string;
	channelId: number;
	channelName: string;
	userType: string;
	mobileNo: string;
	emailId: string;
	userName: string;
	firstName: string;
	middleName: string;
	lastName: string;
	city: string;
	state: string;
	country: string;
	zipCode: string;
	createdAt: string;
	status: string;

	// public UserSearchResponse(UserInfo userInfo, String aliasName, String channelName, String createdAt) {
	// 	super();
	// 	this.userId = userInfo.getUserId();
	// 	this.aliasId = userInfo.getAliasId();
	// 	this.aliasName = aliasName;
	// 	this.systemUserId = userInfo.getSystemUserId();
	// 	this.channelId = userInfo.getChannelId();
	// 	this.channelName = channelName;
	// 	this.userType = userInfo.getUserType().toString();
	// 	this.mobileNo = userInfo.getMobileNo();
	// 	this.emailId = userInfo.getEmailId();
	// 	this.userName = userInfo.getUsername();
	// 	this.firstName = userInfo.getFirstName();
	// 	this.middleName = userInfo.getMiddleName();
	// 	this.lastName = userInfo.getLastName();
	// 	this.city = userInfo.getCity();
	// 	this.state = userInfo.getState();
	// 	this.country = userInfo.getCountry();
	// 	this.zipCode = userInfo.getZip();
	// 	this.status = userInfo.getStatus().toString();
	// 	this.createdAt = createdAt;
	// }
}
