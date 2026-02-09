import { Dispatch } from 'redux';
import { ActionType } from '../actionTypes';
import { Action, AsyncFeature, AsyncStatus, SetAsyncStatusAction } from '../actions';
import * as Api from 'api';
import { ImageInterface } from 'type';
import { logger } from 'utils/logger';
import { RootState } from '../reducers';

export const setAsyncStatus = (
	feature: AsyncFeature,
	status: AsyncStatus,
	error: string | null = null,
): SetAsyncStatusAction => ({
	type: ActionType.SET_ASYNC_STATUS,
	feature,
	status,
	error,
});

export const loadImages = () => {
	return async (dispatch: Dispatch<Action>) => {
		dispatch(setAsyncStatus('publicGallery', 'loading'));

		try {
			const results = await Api.getPublicImages();
			dispatch({
				type: ActionType.LOAD_IMAGES,
				imgList: results,
			});
			dispatch(setAsyncStatus('publicGallery', 'succeeded'));
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			logger.error('Unable to load images:', err);
			dispatch({ type: ActionType.LOAD_IMAGES_ERROR, error: `Unable to load images: ${message}` });
			dispatch(setAsyncStatus('publicGallery', 'failed', `Unable to load images: ${message}`));
		}
	};
};

export const loadUserImages = (showArchived?: boolean) => {
	return async (dispatch: Dispatch<Action>, getState: () => RootState) => {
		dispatch(setAsyncStatus('userGallery', 'loading'));
		const { uid } = getState().auth;
		if (!uid) {
			const error = 'User is not logged in.';
			logger.error(error);
			dispatch(setAsyncStatus('userGallery', 'failed', error));
			return;
		}

		try {
			const results = await Api.getUserImages(uid, showArchived);
			dispatch({
				type: ActionType.LOAD_USER_IMAGES,
				imgUserList: results,
			});
			dispatch(setAsyncStatus('userGallery', 'succeeded'));
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			logger.error('Unable to load user images:', err);
			dispatch({ type: ActionType.LOAD_IMAGES_ERROR, error: `Unable to load images: ${message}` });
			dispatch(setAsyncStatus('userGallery', 'failed', `Unable to load images: ${message}`));
		}
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
