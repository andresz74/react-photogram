import { Dispatch } from 'redux';
import { ActionType } from '../actionTypes';
import { Action } from '../actions';
import * as Api from 'api';
import { ImageInterface } from 'type';

export const loadImages = () => {
	return (dispatch: Dispatch<Action>, getState: () => any) => {

		return Api.getPublicImages()
			.then(results => {
				dispatch({
					type: ActionType.LOAD_IMAGES,
					imgList: results,
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

		return Api.getUserImages(uid, showArchived)
			.then(results => {
				dispatch({
					type: ActionType.LOAD_USER_IMAGES,
					imgUserList: results,
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
	return async (dispatch: Dispatch<Action>) => {
		await Api.archiveImage(image, imgArchived);
		dispatch({ type: ActionType.ARCHIVE_IMAGE });
	};
};

export const togglePrivateImage = (image: ImageInterface, isPrivate: boolean) => {
	return async (dispatch: Dispatch<Action>) => {
		await Api.setImagePrivacy(image, isPrivate);
		dispatch({ type: ActionType.TOGGLE_PRIVATE_IMAGE });
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
