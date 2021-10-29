import { Dispatch } from 'redux';
import { ActionType } from '../actionTypes';
import { Action } from '../actions';
import { getImageList } from 'api';

export const loadImages = () => {
	return (dispatch: Dispatch<Action>) => {
		return getImageList()
			.then(results => dispatch({ type: ActionType.LOAD_IMAGES, imgList: results }))
			.catch(err => dispatch({ type: ActionType.LOAD_IMAGES_ERROR, error: `Unable to load images: ${err}` }));
	};
};
