export interface ImageInterface {
	imgArchived: boolean;
	imgId?: string;
	imgName: string;
	imgSrc: string;
	imgUploadDate: number;
}

type UsersType = 'Admin' | 'Publisher' | 'Viewer';
export interface UserInterface {
	userType: UsersType;
	userID: string;
}
