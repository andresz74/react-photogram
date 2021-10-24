export interface ImageInterface {
	imgArchived: boolean;
	imgId: string;
	imgName: string;
	imgSrc: string;
	imgUploadDate: number;
}

export interface PhotogramInterface {
	imagesArray: ImageInterface[];
}
