import { Dispatch } from 'redux';
import { ActionType } from '../actionTypes';
import { Action } from '../actions';
import { getImageList } from 'api';

export const loadImages = (showArchived: boolean) => {
	return (dispatch: Dispatch<Action>) => {
		return getImageList()
			.then(results => {
				dispatch({
					type: ActionType.LOAD_IMAGES,
					imgList: showArchived ? results : results.filter(item => item.imgArchived !== showArchived),
				});
			})
			.catch(err => dispatch({ type: ActionType.LOAD_IMAGES_ERROR, error: `Unable to load images: ${err}` }));
	};
};
