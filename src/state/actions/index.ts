import { ImageInterface } from 'type';
import { ActionType } from '../actionTypes';

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
}

interface SetUserUIDAction {
	type: ActionType.SET_USER_UID;
	uid: string | null;
}

interface ClearImagesAction {
	type: ActionType.CLEAR_IMAGES;
}

export type Action = LoadImagesAction | LoadUserImagesAction | LoadImagesErrorAction | ArchiveImages | SetUserUIDAction | ClearImagesAction;

