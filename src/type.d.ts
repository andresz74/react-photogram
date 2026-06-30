export interface ImageInterface {
	imgArchived: boolean;
	imgDescription: string;
	imgId?: string;
	imgLikes: number;
	imgName: string;
	imgPrivate: boolean;
	imgSrc: string;
	imgTags?: string[];
	imgTagSlugs?: string[];
	imgUploadDate: number;
	imgUserOwner: string;
}

type UsersType = 'Admin' | 'Publisher' | 'Viewer';
export interface UserInterface {
	userType: UsersType;
	userID: string;
}
