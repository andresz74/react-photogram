import { Dispatch } from 'redux';
import { ActionType } from '../actionTypes';
import { Action } from '../actions';
import * as Api from 'api';
import { ImageInterface } from 'type';
import { logger } from 'utils/logger';

export const loadImages = () => {
	return (dispatch: Dispatch<Action>, getState: () => any) => {

		return Api.getPublicImages()
			.then(results => {
				dispatch({
					type: ActionType.LOAD_IMAGES,
					imgList: results,
				});
			})
			.catch(err => {
				const message = err instanceof Error ? err.message : String(err);
				console.error('Unable to load images:', err);
				dispatch({ type: ActionType.LOAD_IMAGES_ERROR, error: `Unable to load images: ${message}` });
			});
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
			.catch(err => {
				const message = err instanceof Error ? err.message : String(err);
				console.error('Unable to load user images:', err);
				dispatch({ type: ActionType.LOAD_IMAGES_ERROR, error: `Unable to load images: ${message}` });
			});
	};
};

export const clearImages = () => {
	return (dispatch: Dispatch<Action>) => {
		logger.debug('Clearing images');
		dispatch({
			type: ActionType.CLEAR_IMAGES,
		});
	}
}

export const archiveImage = (image: ImageInterface, imgArchived: boolean, removeFromList?: boolean) => {
	return async (dispatch: Dispatch<Action>) => {
		await Api.archiveImage(image, imgArchived);
		dispatch({
			type: ActionType.ARCHIVE_IMAGE,
			imgId: image.imgId,
			imgArchived: !imgArchived,
			removeFromList,
		});
	};
};

export const togglePrivateImage = (image: ImageInterface, isPrivate: boolean) => {
	return async (dispatch: Dispatch<Action>) => {
		await Api.setImagePrivacy(image, isPrivate);
		dispatch({
			type: ActionType.TOGGLE_PRIVATE_IMAGE,
			imgId: image.imgId,
			imgPrivate: !isPrivate,
		});
	};
};

export const setUserUID = (uid: string | null) => {
	return (dispatch: Dispatch<Action>) => {
		logger.debug('Setting UID in Redux:', uid);
		dispatch({
			type: ActionType.SET_USER_UID,
			uid: uid ?? null,
		});
	};
};
