import { ActionType } from '../actionTypes';
import { Action } from '../actions';
import { ImageInterface } from 'type';

const initialState: ImageInterface[] = [];

const reducer = (state: ImageInterface[] = initialState, action: Action) => {
	switch (action.type) {
		case ActionType.LOAD_IMAGES:
			return action.imgList;
		case ActionType.LOAD_IMAGES_ERROR:
			return action.error;
		case ActionType.ARCHIVE_IMAGE:
		default:
			return state;
	}
};

export default reducer;
