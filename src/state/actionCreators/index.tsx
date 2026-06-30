import { Dispatch } from 'redux';
import { ActionType } from '../actionTypes';
import { Action, AsyncFeature, AsyncStatus, SetAsyncStatusAction } from '../actions';
import * as Api from 'api';
import { ImageInterface } from 'type';
import { logger } from 'utils/logger';
import { auth } from 'firebase.configuration';

const mapPhotogramImageToImageInterface = (image: Api.PhotogramImage): ImageInterface => ({
	imgId: image.id,
	imgArchived: Boolean(image.isArchived),
	imgDescription: image.description ?? '',
	imgLikes: 0,
	imgName: image.title ?? image.id,
	imgPrivate: !image.isPublic,
	imgSrc: image.imageUrl,
	imgTags: image.tags ?? [],
	imgTagSlugs: image.tagSlugs ?? [],
	imgUploadDate: Date.parse(image.createdAt) || 0,
	imgUserOwner: image.ownerId ?? '',
});

const getCurrentUserIdToken = async () => {
	const currentUser = auth.currentUser;
	if (!currentUser) {
		throw new Error('User is not logged in.');
	}

	return currentUser.getIdToken();
};

const getImageId = (image: ImageInterface, action: string) => {
	if (!image.imgId?.trim()) {
		throw new Error(`Missing image id. Cannot ${action} image.`);
	}

	return image.imgId;
};

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
			const results = await Api.listPublicImages();
			dispatch({
				type: ActionType.LOAD_IMAGES,
				imgList: results.map(mapPhotogramImageToImageInterface),
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
	return async (dispatch: Dispatch<Action>) => {
		dispatch(setAsyncStatus('userGallery', 'loading'));

		const currentUser = auth.currentUser;
		if (!currentUser) {
			const error = 'User is not logged in.';
			logger.error(error);
			dispatch(setAsyncStatus('userGallery', 'failed', error));
			return;
		}

		try {
			const idToken = await currentUser.getIdToken();
			const results = await Api.listMyImages(showArchived ? { idToken, archived: true } : { idToken });
			dispatch({
				type: ActionType.LOAD_USER_IMAGES,
				imgUserList: results.map(mapPhotogramImageToImageInterface),
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
		const imageId = getImageId(image, 'archive');
		const idToken = await getCurrentUserIdToken();

		if (imgArchived) {
			await Api.unarchiveImageById({ imageId, idToken });
		} else {
			await Api.archiveImageById({ imageId, idToken });
		}

		dispatch({
			type: ActionType.ARCHIVE_IMAGE,
			imgId: imageId,
			imgArchived: !imgArchived,
			removeFromList,
		});
	};
};

export const togglePrivateImage = (image: ImageInterface, isPrivate: boolean) => {
	return async (dispatch: Dispatch<Action>) => {
		const imageId = getImageId(image, 'update visibility for');
		const idToken = await getCurrentUserIdToken();

		await Api.updateImageVisibility({
			imageId,
			idToken,
			isPublic: isPrivate,
		});

		dispatch({
			type: ActionType.TOGGLE_PRIVATE_IMAGE,
			imgId: imageId,
			imgPrivate: !isPrivate,
		});
	};
};

export const deleteImage = (image: ImageInterface) => {
	return async (_dispatch: Dispatch<Action>) => {
		const imageId = getImageId(image, 'delete');
		const idToken = await getCurrentUserIdToken();
		await Api.deleteImage({
			imageId,
			idToken,
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
