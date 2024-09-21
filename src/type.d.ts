export interface ImageInterface {
	imgArchived: boolean;
	imgId?: string;
	imgName: string;
	imgSrc: string;
	imgUploadDate: number;
	imgUserOwner: string;
}

type UsersType = 'Admin' | 'Publisher' | 'Viewer';
export interface UserInterface {
	userType: UsersType;
	userID: string;
}
