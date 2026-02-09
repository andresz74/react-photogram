import { ImageInterface } from 'type';
import { ActionType } from '../actionTypes';

export type AsyncFeature = 'publicGallery' | 'userGallery' | 'auth' | 'upload';
export type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface LoadImagesAction {
	type: ActionType.LOAD_IMAGES;
	imgList: ImageInterface[];
}

interface LoadUserImagesAction {
	type: ActionType.LOAD_USER_IMAGES;
	imgUserList: ImageInterface[];
}

interface LoadImagesErrorAction {
	type: ActionType.LOAD_IMAGES_ERROR;
	error: string;
}

interface ArchiveImages {
	type: ActionType.ARCHIVE_IMAGE;
	imgId?: string;
	imgArchived?: boolean;
	removeFromList?: boolean;
}

interface TogglePrivateImage {
	type: ActionType.TOGGLE_PRIVATE_IMAGE;
	imgId?: string;
	imgPrivate?: boolean;
}

interface SetUserUIDAction {
	type: ActionType.SET_USER_UID;
	uid: string | null;
}

interface ClearImagesAction {
	type: ActionType.CLEAR_IMAGES;
}

export interface SetAsyncStatusAction {
	type: ActionType.SET_ASYNC_STATUS;
	feature: AsyncFeature;
	status: AsyncStatus;
	error: string | null;
}

export type Action =
	| LoadImagesAction
	| LoadUserImagesAction
	| LoadImagesErrorAction
	| ArchiveImages
	| TogglePrivateImage
	| SetUserUIDAction
	| ClearImagesAction
	| SetAsyncStatusAction;
