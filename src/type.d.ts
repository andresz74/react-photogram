export interface ImageInterface {
	imgArchived: boolean;
	imgDescription: string;
	imgId?: string;
	imgName: string;
	imgPrivate: boolean;
	imgSrc: string;
	imgUploadDate: number;
	imgUserOwner: string;
}

type UsersType = 'Admin' | 'Publisher' | 'Viewer';
export interface UserInterface {
	userType: UsersType;
	userID: string;
}
