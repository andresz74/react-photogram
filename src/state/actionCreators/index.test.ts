import { ActionType } from '../actionTypes';
import { archiveImage as archiveImageAction, deleteImage, loadImages, loadUserImages, togglePrivateImage } from './index';
import * as Api from 'api';

let mockCurrentUser: { getIdToken: jest.Mock } | null = null;

jest.mock('api', () => ({
	archiveImage: jest.fn(),
	archiveImageById: jest.fn(),
	getPublicImages: jest.fn(),
	getUserImages: jest.fn(),
	deleteImage: jest.fn(),
	listMyImages: jest.fn(),
	listPublicImages: jest.fn(),
	setImagePrivacy: jest.fn(),
	unarchiveImageById: jest.fn(),
	updateImageVisibility: jest.fn(),
}));

jest.mock('firebase.configuration', () => ({
	auth: {
		get currentUser() {
			return mockCurrentUser;
		},
	},
}));

const listPublicImagesMock = Api.listPublicImages as jest.Mock;
const getPublicImagesMock = Api.getPublicImages as jest.Mock;
const listMyImagesMock = Api.listMyImages as jest.Mock;
const getUserImagesMock = Api.getUserImages as jest.Mock;
const deleteImageMock = Api.deleteImage as jest.Mock;
const legacyArchiveImageMock = Api.archiveImage as jest.Mock;
const archiveImageByIdMock = Api.archiveImageById as jest.Mock;
const setImagePrivacyMock = Api.setImagePrivacy as jest.Mock;
const unarchiveImageByIdMock = Api.unarchiveImageById as jest.Mock;
const updateImageVisibilityMock = Api.updateImageVisibility as jest.Mock;

beforeEach(() => {
	jest.clearAllMocks();
	mockCurrentUser = null;
});

test('public gallery load path calls listPublicImages without requiring auth', async () => {
	const dispatch = jest.fn();
	listPublicImagesMock.mockResolvedValue([
		{
			id: 'image-1',
			ownerId: 'owner-1',
			title: 'Backend image',
			description: 'Loaded from the provider-agnostic API',
			imageUrl: 'https://cdn.test/image-1.jpg',
			thumbnailUrl: 'https://cdn.test/image-1-thumb.jpg',
			isPublic: true,
			createdAt: '2026-06-22T12:00:00.000Z',
		},
	]);

	await loadImages()(dispatch);

	expect(listPublicImagesMock).toHaveBeenCalledWith();
	expect(getPublicImagesMock).not.toHaveBeenCalled();
	expect(dispatch).toHaveBeenNthCalledWith(1, {
		type: ActionType.SET_ASYNC_STATUS,
		feature: 'publicGallery',
		status: 'loading',
		error: null,
	});
	expect(dispatch).toHaveBeenNthCalledWith(2, {
		type: ActionType.LOAD_IMAGES,
		imgList: [
			{
				imgId: 'image-1',
				imgArchived: false,
				imgDescription: 'Loaded from the provider-agnostic API',
				imgLikes: 0,
				imgName: 'Backend image',
				imgPrivate: false,
				imgSrc: 'https://cdn.test/image-1.jpg',
				imgUploadDate: Date.parse('2026-06-22T12:00:00.000Z'),
				imgUserOwner: 'owner-1',
			},
		],
	});
	expect(dispatch).toHaveBeenNthCalledWith(3, {
		type: ActionType.SET_ASYNC_STATUS,
		feature: 'publicGallery',
		status: 'succeeded',
		error: null,
	});
});

test('public gallery load path stores an error state when listPublicImages rejects', async () => {
	const dispatch = jest.fn();
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
	listPublicImagesMock.mockRejectedValue(new Error('API unavailable'));

	try {
		await loadImages()(dispatch);

		expect(getPublicImagesMock).not.toHaveBeenCalled();
		expect(dispatch).toHaveBeenCalledWith({
			type: ActionType.LOAD_IMAGES_ERROR,
			error: 'Unable to load images: API unavailable',
		});
		expect(dispatch).toHaveBeenCalledWith({
			type: ActionType.SET_ASYNC_STATUS,
			feature: 'publicGallery',
			status: 'failed',
			error: 'Unable to load images: API unavailable',
		});
	} finally {
		consoleErrorSpy.mockRestore();
	}
});

test('protected user gallery load path obtains a Firebase ID token and calls listMyImages', async () => {
	const dispatch = jest.fn();
	const getIdToken = jest.fn().mockResolvedValue('id-token-1');
	mockCurrentUser = { getIdToken };
	listMyImagesMock.mockResolvedValue([
		{
			id: 'user-image-1',
			ownerId: 'owner-1',
			title: 'My backend image',
			description: 'Private gallery image',
			imageUrl: 'https://cdn.test/user-image-1.jpg',
			thumbnailUrl: 'https://cdn.test/user-image-1-thumb.jpg',
			isPublic: false,
			createdAt: '2026-06-23T12:00:00.000Z',
		},
	]);

	await loadUserImages(true)(dispatch);

	expect(getIdToken).toHaveBeenCalledWith();
	expect(listMyImagesMock).toHaveBeenCalledWith({ idToken: 'id-token-1', archived: true });
	expect(getUserImagesMock).not.toHaveBeenCalled();
	expect(dispatch).toHaveBeenNthCalledWith(1, {
		type: ActionType.SET_ASYNC_STATUS,
		feature: 'userGallery',
		status: 'loading',
		error: null,
	});
	expect(dispatch).toHaveBeenNthCalledWith(2, {
		type: ActionType.LOAD_USER_IMAGES,
		imgUserList: [
			{
				imgId: 'user-image-1',
				imgArchived: false,
				imgDescription: 'Private gallery image',
				imgLikes: 0,
				imgName: 'My backend image',
				imgPrivate: true,
				imgSrc: 'https://cdn.test/user-image-1.jpg',
				imgUploadDate: Date.parse('2026-06-23T12:00:00.000Z'),
				imgUserOwner: 'owner-1',
			},
		],
	});
	expect(dispatch).toHaveBeenNthCalledWith(3, {
		type: ActionType.SET_ASYNC_STATUS,
		feature: 'userGallery',
		status: 'succeeded',
		error: null,
	});
});

test('normal protected user gallery load path calls listMyImages without archived flag', async () => {
	const dispatch = jest.fn();
	const getIdToken = jest.fn().mockResolvedValue('id-token-1');
	mockCurrentUser = { getIdToken };
	listMyImagesMock.mockResolvedValue([]);

	await loadUserImages()(dispatch);

	expect(getIdToken).toHaveBeenCalledWith();
	expect(listMyImagesMock).toHaveBeenCalledWith({ idToken: 'id-token-1' });
	expect(getUserImagesMock).not.toHaveBeenCalled();
});

test('protected user gallery load path stores empty state when backend returns no images', async () => {
	const dispatch = jest.fn();
	mockCurrentUser = { getIdToken: jest.fn().mockResolvedValue('id-token-1') };
	listMyImagesMock.mockResolvedValue([]);

	await loadUserImages()(dispatch);

	expect(dispatch).toHaveBeenCalledWith({
		type: ActionType.LOAD_USER_IMAGES,
		imgUserList: [],
	});
	expect(dispatch).toHaveBeenCalledWith({
		type: ActionType.SET_ASYNC_STATUS,
		feature: 'userGallery',
		status: 'succeeded',
		error: null,
	});
});

test('protected user gallery load path stores an error state when listMyImages rejects', async () => {
	const dispatch = jest.fn();
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
	mockCurrentUser = { getIdToken: jest.fn().mockResolvedValue('id-token-1') };
	listMyImagesMock.mockRejectedValue(new Error('API unavailable'));

	try {
		await loadUserImages()(dispatch);

		expect(getUserImagesMock).not.toHaveBeenCalled();
		expect(dispatch).toHaveBeenCalledWith({
			type: ActionType.LOAD_IMAGES_ERROR,
			error: 'Unable to load images: API unavailable',
		});
		expect(dispatch).toHaveBeenCalledWith({
			type: ActionType.SET_ASYNC_STATUS,
			feature: 'userGallery',
			status: 'failed',
			error: 'Unable to load images: API unavailable',
		});
	} finally {
		consoleErrorSpy.mockRestore();
	}
});

test('protected user gallery load path fails when Firebase current user is missing', async () => {
	const dispatch = jest.fn();
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
	mockCurrentUser = null;

	try {
		await loadUserImages()(dispatch);

		expect(listMyImagesMock).not.toHaveBeenCalled();
		expect(getUserImagesMock).not.toHaveBeenCalled();
		expect(dispatch).toHaveBeenCalledWith({
			type: ActionType.SET_ASYNC_STATUS,
			feature: 'userGallery',
			status: 'failed',
			error: 'User is not logged in.',
		});
	} finally {
		consoleErrorSpy.mockRestore();
	}
});

test('protected user gallery load path stores an error state when ID token retrieval fails', async () => {
	const dispatch = jest.fn();
	const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
	mockCurrentUser = { getIdToken: jest.fn().mockRejectedValue(new Error('Token unavailable')) };

	try {
		await loadUserImages()(dispatch);

		expect(listMyImagesMock).not.toHaveBeenCalled();
		expect(getUserImagesMock).not.toHaveBeenCalled();
		expect(dispatch).toHaveBeenCalledWith({
			type: ActionType.LOAD_IMAGES_ERROR,
			error: 'Unable to load images: Token unavailable',
		});
		expect(dispatch).toHaveBeenCalledWith({
			type: ActionType.SET_ASYNC_STATUS,
			feature: 'userGallery',
			status: 'failed',
			error: 'Unable to load images: Token unavailable',
		});
	} finally {
		consoleErrorSpy.mockRestore();
	}
});

test('hide flow obtains a Firebase ID token and calls canonical visibility API', async () => {
	const dispatch = jest.fn();
	const getIdToken = jest.fn().mockResolvedValue('visibility-token-1');
	const image = {
		imgId: 'backend-image-1',
		imgArchived: false,
		imgDescription: '',
		imgLikes: 0,
		imgName: 'legacy-file-name.jpg',
		imgPrivate: false,
		imgSrc: 'https://cdn.test/backend-image-1.jpg',
		imgUploadDate: 0,
		imgUserOwner: 'user-123',
	};
	mockCurrentUser = { getIdToken };
	updateImageVisibilityMock.mockResolvedValue({
		id: 'backend-image-1',
		imageUrl: 'https://cdn.test/backend-image-1.jpg',
		isPublic: false,
		createdAt: '2026-06-23T12:00:00.000Z',
	});

	await togglePrivateImage(image, false)(dispatch);

	expect(getIdToken).toHaveBeenCalledWith();
	expect(updateImageVisibilityMock).toHaveBeenCalledWith({
		imageId: 'backend-image-1',
		idToken: 'visibility-token-1',
		isPublic: false,
	});
	expect(updateImageVisibilityMock.mock.calls[0][0]).not.toMatchObject({
		imageId: 'https://cdn.test/backend-image-1.jpg',
	});
	expect(updateImageVisibilityMock.mock.calls[0][0]).not.toHaveProperty('uid');
	expect(setImagePrivacyMock).not.toHaveBeenCalled();
	expect(dispatch).toHaveBeenCalledWith({
		type: ActionType.TOGGLE_PRIVATE_IMAGE,
		imgId: 'backend-image-1',
		imgPrivate: true,
	});
});

test('show flow obtains a Firebase ID token and calls canonical visibility API', async () => {
	const dispatch = jest.fn();
	mockCurrentUser = { getIdToken: jest.fn().mockResolvedValue('visibility-token-1') };
	updateImageVisibilityMock.mockResolvedValue({
		id: 'backend-image-1',
		imageUrl: 'https://cdn.test/backend-image-1.jpg',
		isPublic: true,
		createdAt: '2026-06-23T12:00:00.000Z',
	});

	await togglePrivateImage({
		imgId: 'backend-image-1',
		imgArchived: false,
		imgDescription: '',
		imgLikes: 0,
		imgName: 'legacy-file-name.jpg',
		imgPrivate: true,
		imgSrc: 'https://cdn.test/backend-image-1.jpg',
		imgUploadDate: 0,
		imgUserOwner: 'user-123',
	}, true)(dispatch);

	expect(updateImageVisibilityMock).toHaveBeenCalledWith({
		imageId: 'backend-image-1',
		idToken: 'visibility-token-1',
		isPublic: true,
	});
	expect(setImagePrivacyMock).not.toHaveBeenCalled();
	expect(dispatch).toHaveBeenCalledWith({
		type: ActionType.TOGGLE_PRIVATE_IMAGE,
		imgId: 'backend-image-1',
		imgPrivate: false,
	});
});

test('archive flow obtains a Firebase ID token and calls canonical archive API', async () => {
	const dispatch = jest.fn();
	const getIdToken = jest.fn().mockResolvedValue('archive-token-1');
	mockCurrentUser = { getIdToken };
	archiveImageByIdMock.mockResolvedValue({
		id: 'backend-image-1',
		imageUrl: 'https://cdn.test/backend-image-1.jpg',
		isPublic: false,
		isArchived: true,
		createdAt: '2026-06-23T12:00:00.000Z',
	});

	await archiveImageAction({
		imgId: 'backend-image-1',
		imgArchived: false,
		imgDescription: '',
		imgLikes: 0,
		imgName: 'legacy-file-name.jpg',
		imgPrivate: false,
		imgSrc: 'https://cdn.test/backend-image-1.jpg',
		imgUploadDate: 0,
		imgUserOwner: 'user-123',
	}, false, true)(dispatch);

	expect(getIdToken).toHaveBeenCalledWith();
	expect(archiveImageByIdMock).toHaveBeenCalledWith({
		imageId: 'backend-image-1',
		idToken: 'archive-token-1',
	});
	expect(archiveImageByIdMock.mock.calls[0][0]).not.toHaveProperty('uid');
	expect(archiveImageByIdMock.mock.calls[0][0]).not.toMatchObject({
		imageId: 'https://cdn.test/backend-image-1.jpg',
	});
	expect(legacyArchiveImageMock).not.toHaveBeenCalled();
	expect(dispatch).toHaveBeenCalledWith({
		type: ActionType.ARCHIVE_IMAGE,
		imgId: 'backend-image-1',
		imgArchived: true,
		removeFromList: true,
	});
});

test('unarchive flow obtains a Firebase ID token and calls canonical unarchive API', async () => {
	const dispatch = jest.fn();
	mockCurrentUser = { getIdToken: jest.fn().mockResolvedValue('archive-token-1') };
	unarchiveImageByIdMock.mockResolvedValue({
		id: 'backend-image-1',
		imageUrl: 'https://cdn.test/backend-image-1.jpg',
		isPublic: false,
		isArchived: false,
		createdAt: '2026-06-23T12:00:00.000Z',
	});

	await archiveImageAction({
		imgId: 'backend-image-1',
		imgArchived: true,
		imgDescription: '',
		imgLikes: 0,
		imgName: 'legacy-file-name.jpg',
		imgPrivate: false,
		imgSrc: 'https://cdn.test/backend-image-1.jpg',
		imgUploadDate: 0,
		imgUserOwner: 'user-123',
	}, true)(dispatch);

	expect(unarchiveImageByIdMock).toHaveBeenCalledWith({
		imageId: 'backend-image-1',
		idToken: 'archive-token-1',
	});
	expect(legacyArchiveImageMock).not.toHaveBeenCalled();
	expect(dispatch).toHaveBeenCalledWith({
		type: ActionType.ARCHIVE_IMAGE,
		imgId: 'backend-image-1',
		imgArchived: false,
		removeFromList: undefined,
	});
});

test('metadata update flows fail before API call when image id is missing', async () => {
	const dispatch = jest.fn();
	mockCurrentUser = { getIdToken: jest.fn().mockResolvedValue('token-1') };
	const image = {
		imgArchived: false,
		imgDescription: '',
		imgLikes: 0,
		imgName: 'legacy-file-name.jpg',
		imgPrivate: false,
		imgSrc: 'https://cdn.test/backend-image-1.jpg',
		imgUploadDate: 0,
		imgUserOwner: 'user-123',
	};

	await expect(togglePrivateImage(image, false)(dispatch)).rejects.toThrow('Missing image id. Cannot update visibility for image.');
	await expect(archiveImageAction(image, false)(dispatch)).rejects.toThrow('Missing image id. Cannot archive image.');

	expect(updateImageVisibilityMock).not.toHaveBeenCalled();
	expect(archiveImageByIdMock).not.toHaveBeenCalled();
	expect(unarchiveImageByIdMock).not.toHaveBeenCalled();
});

test('metadata update flows fail when Firebase current user is missing', async () => {
	const dispatch = jest.fn();
	mockCurrentUser = null;
	const image = {
		imgId: 'backend-image-1',
		imgArchived: false,
		imgDescription: '',
		imgLikes: 0,
		imgName: 'legacy-file-name.jpg',
		imgPrivate: false,
		imgSrc: 'https://cdn.test/backend-image-1.jpg',
		imgUploadDate: 0,
		imgUserOwner: 'user-123',
	};

	await expect(togglePrivateImage(image, false)(dispatch)).rejects.toThrow('User is not logged in.');
	await expect(archiveImageAction(image, false)(dispatch)).rejects.toThrow('User is not logged in.');

	expect(updateImageVisibilityMock).not.toHaveBeenCalled();
	expect(archiveImageByIdMock).not.toHaveBeenCalled();
});

test('metadata update flows surface token retrieval and API failures', async () => {
	const dispatch = jest.fn();
	const image = {
		imgId: 'backend-image-1',
		imgArchived: false,
		imgDescription: '',
		imgLikes: 0,
		imgName: 'legacy-file-name.jpg',
		imgPrivate: false,
		imgSrc: 'https://cdn.test/backend-image-1.jpg',
		imgUploadDate: 0,
		imgUserOwner: 'user-123',
	};

	mockCurrentUser = { getIdToken: jest.fn().mockRejectedValue(new Error('Token unavailable')) };
	await expect(togglePrivateImage(image, false)(dispatch)).rejects.toThrow('Token unavailable');

	mockCurrentUser = { getIdToken: jest.fn().mockResolvedValue('archive-token-1') };
	archiveImageByIdMock.mockRejectedValue(new Error('Archive failed'));
	await expect(archiveImageAction(image, false)(dispatch)).rejects.toThrow('Archive failed');
});

test('delete flow obtains a Firebase ID token and calls canonical deleteImage input', async () => {
	const dispatch = jest.fn();
	const getIdToken = jest.fn().mockResolvedValue('delete-token-1');
	const image = {
		imgId: 'backend-image-1',
		imgArchived: false,
		imgDescription: 'Delete me',
		imgLikes: 0,
		imgName: 'legacy-file-name.jpg',
		imgPrivate: false,
		imgSrc: 'https://cdn.test/backend-image-1.jpg',
		imgUploadDate: Date.parse('2026-06-23T12:00:00.000Z'),
		imgUserOwner: 'user-123',
	};
	mockCurrentUser = { getIdToken };
	deleteImageMock.mockResolvedValue({ imageId: 'backend-image-1', deleted: true });

	await deleteImage(image)(dispatch);

	expect(getIdToken).toHaveBeenCalledWith();
	expect(deleteImageMock).toHaveBeenCalledWith({
		imageId: 'backend-image-1',
		idToken: 'delete-token-1',
	});
	expect(deleteImageMock.mock.calls[0][0]).not.toBe(image);
	expect(deleteImageMock.mock.calls[0][0]).not.toMatchObject({
		imageId: 'https://cdn.test/backend-image-1.jpg',
	});
	expect(deleteImageMock.mock.calls[0][0]).not.toHaveProperty('uid');
	expect(dispatch).not.toHaveBeenCalled();
});

test('delete flow handles deleted false without crashing', async () => {
	const dispatch = jest.fn();
	mockCurrentUser = { getIdToken: jest.fn().mockResolvedValue('delete-token-1') };
	deleteImageMock.mockResolvedValue({ imageId: 'backend-image-1', deleted: false });

	await expect(deleteImage({
		imgId: 'backend-image-1',
		imgArchived: false,
		imgDescription: '',
		imgLikes: 0,
		imgName: 'legacy-file-name.jpg',
		imgPrivate: false,
		imgSrc: 'https://cdn.test/backend-image-1.jpg',
		imgUploadDate: 0,
		imgUserOwner: 'user-123',
	})(dispatch)).resolves.toBeUndefined();
});

test('delete flow fails before API call when image id is missing', async () => {
	const dispatch = jest.fn();
	mockCurrentUser = { getIdToken: jest.fn().mockResolvedValue('delete-token-1') };

	await expect(deleteImage({
		imgArchived: false,
		imgDescription: '',
		imgLikes: 0,
		imgName: 'legacy-file-name.jpg',
		imgPrivate: false,
		imgSrc: 'https://cdn.test/backend-image-1.jpg',
		imgUploadDate: 0,
		imgUserOwner: 'user-123',
	})(dispatch)).rejects.toThrow('Missing image id. Cannot delete image.');

	expect(deleteImageMock).not.toHaveBeenCalled();
});

test('delete flow fails when Firebase current user is missing', async () => {
	const dispatch = jest.fn();
	mockCurrentUser = null;

	await expect(deleteImage({
		imgId: 'backend-image-1',
		imgArchived: false,
		imgDescription: '',
		imgLikes: 0,
		imgName: 'legacy-file-name.jpg',
		imgPrivate: false,
		imgSrc: 'https://cdn.test/backend-image-1.jpg',
		imgUploadDate: 0,
		imgUserOwner: 'user-123',
	})(dispatch)).rejects.toThrow('User is not logged in.');

	expect(deleteImageMock).not.toHaveBeenCalled();
});

test('delete flow surfaces ID token retrieval failures', async () => {
	const dispatch = jest.fn();
	mockCurrentUser = { getIdToken: jest.fn().mockRejectedValue(new Error('Token unavailable')) };

	await expect(deleteImage({
		imgId: 'backend-image-1',
		imgArchived: false,
		imgDescription: '',
		imgLikes: 0,
		imgName: 'legacy-file-name.jpg',
		imgPrivate: false,
		imgSrc: 'https://cdn.test/backend-image-1.jpg',
		imgUploadDate: 0,
		imgUserOwner: 'user-123',
	})(dispatch)).rejects.toThrow('Token unavailable');

	expect(deleteImageMock).not.toHaveBeenCalled();
});

test('delete flow surfaces API delete failures', async () => {
	const dispatch = jest.fn();
	mockCurrentUser = { getIdToken: jest.fn().mockResolvedValue('delete-token-1') };
	deleteImageMock.mockRejectedValue(new Error('Delete failed'));

	await expect(deleteImage({
		imgId: 'backend-image-1',
		imgArchived: false,
		imgDescription: '',
		imgLikes: 0,
		imgName: 'legacy-file-name.jpg',
		imgPrivate: false,
		imgSrc: 'https://cdn.test/backend-image-1.jpg',
		imgUploadDate: 0,
		imgUserOwner: 'user-123',
	})(dispatch)).rejects.toThrow('Delete failed');
});

export {};
