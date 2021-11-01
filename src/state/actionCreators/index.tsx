import { Dispatch } from 'redux';
import { ActionType } from '../actionTypes';
import { Action } from '../actions';
import * as Api from 'api';
import { ImageInterface } from 'type';

export const loadImages = (showArchived?: boolean) => {
	return (dispatch: Dispatch<Action>) => {
		return Api.getImageList()
			.then(results => {
				dispatch({
					type: ActionType.LOAD_IMAGES,
					imgList: !!showArchived ? results : results.filter(item => item.imgArchived === showArchived),
				});
			})
			.catch(err => dispatch({ type: ActionType.LOAD_IMAGES_ERROR, error: `Unable to load images: ${err}` }));
	};
};

export const archiveImage = (image: ImageInterface, imgArchived: boolean) => {
	return (dispatch: Dispatch<Action>) => {
		Api.archiveImage(image, imgArchived);
		dispatch({ 
			type: ActionType.ARCHIVE_IMAGE,
		})
	}
};
