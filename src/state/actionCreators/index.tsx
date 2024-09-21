import { Dispatch } from 'redux';
import { ActionType } from '../actionTypes';
import { Action } from '../actions';
import * as Api from 'api';
import { ImageInterface } from 'type';

export const loadImages = (showArchived?: boolean) => {
	return (dispatch: Dispatch<Action>, getState: () => any) => {
		const { uid } = getState().auth; // Get the current user's UID from the Redux store

		return Api.getImageList()
			.then(results => {
				const filteredResults = results.filter(item => item.imgUserOwner === uid); // Filter by user UID
				dispatch({
					type: ActionType.LOAD_IMAGES,
					imgList: !!showArchived
						? filteredResults
						: filteredResults.filter(item => item.imgArchived === showArchived),
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
		});
	};
};

export const setUserUID = (uid: string) => {
	return (dispatch: Dispatch<Action>) => {
		dispatch({
			type: ActionType.SET_USER_UID,
			uid,
		});
	};
};

