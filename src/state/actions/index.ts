import { ImageInterface } from 'type';
import { ActionType } from '../actionTypes';

interface LoadImagesAction {
	type: ActionType.LOAD_IMAGES;
    imgList: ImageInterface[];
}

interface LoadImagesErrorAction {
    type: ActionType.LOAD_IMAGES_ERROR;
    error: string;
}
export type Action = LoadImagesAction | LoadImagesErrorAction;
