import { Dispatch } from 'redux';
import { ActionType } from '../actionTypes';
import { Action } from '../actions';
import * as Api from 'api';
import { ImageInterface } from 'type';

export const loadImages = () => {
	return (dispatch: Dispatch<Action>, getState: () => any) => {

		return Api.getImageList()
			.then(results => {
				dispatch({
					type: ActionType.LOAD_IMAGES,
					imgList: results.filter(item => (item.imgArchived === false) && (item.imgPrivate === false)),
				});
			})
			.catch(err => dispatch({ type: ActionType.LOAD_IMAGES_ERROR, error: `Unable to load images: ${err}` }));
	};
};

export const loadUserImages = (showArchived?: boolean) => {
	return (dispatch: Dispatch<Action>, getState: () => any) => {
		const { uid } = getState().auth;
		if (!uid) {
			console.error('User is not logged in.');
			return;
		}

		return Api.getImageList()
			.then(results => {
				const filteredResults = results.filter(item => item.imgUserOwner === uid);
				dispatch({
					type: ActionType.LOAD_USER_IMAGES,
					imgUserList: !!showArchived
						? filteredResults
						: filteredResults.filter(item => !item.imgArchived),
				});
			})
			.catch(err => dispatch({ type: ActionType.LOAD_IMAGES_ERROR, error: `Unable to load images: ${err}` }));
	};
};

export const clearImages = () => {
	console.log('Clear Images');
	return (dispatch: Dispatch<Action>) => {
		dispatch({
			type: ActionType.CLEAR_IMAGES,
		});
	}
}

export const archiveImage = (image: ImageInterface, imgArchived: boolean) => {
	return (dispatch: Dispatch<Action>) => {
		Api.archiveImage(image, imgArchived);
		dispatch({
			type: ActionType.ARCHIVE_IMAGE,
		});
	};
};

export const setUserUID = (uid: string | null) => {
	return (dispatch: Dispatch<Action>) => {
		console.log("Setting UID in Redux:", uid);  // Log when setting UID
		dispatch({
			type: ActionType.SET_USER_UID,
			uid: uid ?? null,
		});
	};
};
