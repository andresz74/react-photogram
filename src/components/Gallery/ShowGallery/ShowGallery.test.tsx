import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as Api from 'api';
import { ShowGallery } from './ShowGallery';

const image = {
	imgId: 'backend-image-1',
	imgArchived: false,
	imgDescription: 'Delete me',
	imgLikes: 0,
	imgName: 'Backend image',
	imgPrivate: false,
	imgSrc: 'https://cdn.test/backend-image-1.jpg',
	imgUploadDate: Date.parse('2026-06-23T12:00:00.000Z'),
	imgUserOwner: 'user-123',
};

let mockCurrentUser: { getIdToken: jest.Mock } | null = null;
let mockState = {
	auth: { uid: 'user-123' as string | null },
	images: [] as typeof image[],
	userImages: [image] as typeof image[],
	requestStatus: {
		publicGallery: { status: 'idle', error: null as string | null },
		userGallery: { status: 'idle', error: null as string | null },
	},
};
const mockDispatch: jest.Mock<unknown, [unknown]> = jest.fn();
const mockFirestoreCollection = jest.fn();

jest.mock('api', () => ({
	archiveImage: jest.fn(),
	archiveImageById: jest.fn(),
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
	db: {
		collection: (collectionName: string) => mockFirestoreCollection(collectionName),
	},
	imagesDbCollection: 'imagesArray',
}));

jest.mock('react-redux', () => ({
	useDispatch: () => mockDispatch,
	useSelector: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}));

const deleteImageMock = Api.deleteImage as jest.Mock;
const listMyImagesMock = Api.listMyImages as jest.Mock;
const archiveImageByIdMock = Api.archiveImageById as jest.Mock;
const legacyArchiveImageMock = Api.archiveImage as jest.Mock;
const setImagePrivacyMock = Api.setImagePrivacy as jest.Mock;
const unarchiveImageByIdMock = Api.unarchiveImageById as jest.Mock;
const updateImageVisibilityMock = Api.updateImageVisibility as jest.Mock;

const renderGallery = () => render(
	<MemoryRouter>
		<ShowGallery uid="user-123" />
	</MemoryRouter>,
);

beforeEach(() => {
	mockCurrentUser = { getIdToken: jest.fn().mockResolvedValue('id-token-1') };
	mockState = {
		auth: { uid: 'user-123' },
		images: [],
		userImages: [image],
		requestStatus: {
			publicGallery: { status: 'idle', error: null },
			userGallery: { status: 'idle', error: null },
		},
	};
	mockDispatch.mockClear();
	mockDispatch.mockImplementation((action: unknown) => {
		if (typeof action === 'function') {
			return action(mockDispatch);
		}

		return action;
	});
	mockFirestoreCollection.mockClear();
	archiveImageByIdMock.mockReset();
	deleteImageMock.mockReset();
	legacyArchiveImageMock.mockReset();
	listMyImagesMock.mockReset();
	setImagePrivacyMock.mockReset();
	unarchiveImageByIdMock.mockReset();
	updateImageVisibilityMock.mockReset();
	archiveImageByIdMock.mockResolvedValue({
		id: 'backend-image-1',
		imageUrl: 'https://cdn.test/backend-image-1.jpg',
		isPublic: false,
		isArchived: true,
		createdAt: '2026-06-23T12:00:00.000Z',
	});
	listMyImagesMock.mockResolvedValue([]);
	unarchiveImageByIdMock.mockResolvedValue({
		id: 'backend-image-1',
		imageUrl: 'https://cdn.test/backend-image-1.jpg',
		isPublic: false,
		isArchived: false,
		createdAt: '2026-06-23T12:00:00.000Z',
	});
	updateImageVisibilityMock.mockResolvedValue({
		id: 'backend-image-1',
		imageUrl: 'https://cdn.test/backend-image-1.jpg',
		isPublic: false,
		createdAt: '2026-06-23T12:00:00.000Z',
	});
});

test('hide button dispatches migrated visibility action', async () => {
	renderGallery();

	fireEvent.click(screen.getByRole('button', { name: 'Make image private' }));

	await waitFor(() => {
		expect(updateImageVisibilityMock).toHaveBeenCalledWith({
			imageId: 'backend-image-1',
			idToken: 'id-token-1',
			isPublic: false,
		});
	});
	expect(setImagePrivacyMock).not.toHaveBeenCalled();
	expect(mockFirestoreCollection).not.toHaveBeenCalled();
});

test('show button dispatches migrated visibility action', async () => {
	mockState.userImages = [{ ...image, imgPrivate: true }];
	renderGallery();

	fireEvent.click(screen.getByRole('button', { name: 'Make image public' }));

	await waitFor(() => {
		expect(updateImageVisibilityMock).toHaveBeenCalledWith({
			imageId: 'backend-image-1',
			idToken: 'id-token-1',
			isPublic: true,
		});
	});
	expect(setImagePrivacyMock).not.toHaveBeenCalled();
	expect(mockFirestoreCollection).not.toHaveBeenCalled();
});

test('archive button dispatches migrated archive action', async () => {
	renderGallery();

	fireEvent.click(screen.getByRole('button', { name: 'Archive image' }));

	await waitFor(() => {
		expect(archiveImageByIdMock).toHaveBeenCalledWith({
			imageId: 'backend-image-1',
			idToken: 'id-token-1',
		});
	});
	expect(legacyArchiveImageMock).not.toHaveBeenCalled();
	expect(mockFirestoreCollection).not.toHaveBeenCalled();
});

test('unarchive button dispatches migrated unarchive action', async () => {
	mockState.userImages = [{ ...image, imgArchived: true }];
	renderGallery();

	fireEvent.click(screen.getByRole('button', { name: 'Unarchive image' }));

	await waitFor(() => {
		expect(unarchiveImageByIdMock).toHaveBeenCalledWith({
			imageId: 'backend-image-1',
			idToken: 'id-token-1',
		});
	});
	expect(legacyArchiveImageMock).not.toHaveBeenCalled();
	expect(mockFirestoreCollection).not.toHaveBeenCalled();
});

test('show archived toggle loads archived backend images', async () => {
	renderGallery();

	await waitFor(() => expect(listMyImagesMock).toHaveBeenCalledWith({ idToken: 'id-token-1' }));
	fireEvent.click(screen.getByText('Show Archived'));

	await waitFor(() => expect(listMyImagesMock).toHaveBeenCalledWith({
		idToken: 'id-token-1',
		archived: true,
	}));
});

test('user-facing delete calls canonical delete API and refreshes my gallery on success', async () => {
	let resolveDelete: () => void = () => undefined;
	const deletePromise = new Promise((resolve) => {
		resolveDelete = () => resolve({ imageId: 'backend-image-1', deleted: true });
	});
	deleteImageMock.mockReturnValue(deletePromise);
	renderGallery();

	fireEvent.click(screen.getByRole('button', { name: 'Delete image' }));

	expect(screen.getByRole('button', { name: 'Deleting image' })).toBeDisabled();
	await waitFor(() => {
		expect(deleteImageMock).toHaveBeenCalledWith({
			imageId: 'backend-image-1',
			idToken: 'id-token-1',
		});
	});
	expect(deleteImageMock.mock.calls[0][0]).not.toBe(image);
	expect(deleteImageMock.mock.calls[0][0]).not.toMatchObject({
		imageId: 'https://cdn.test/backend-image-1.jpg',
	});
	expect(deleteImageMock.mock.calls[0][0]).not.toHaveProperty('uid');
	expect(mockFirestoreCollection).not.toHaveBeenCalled();

	await act(async () => {
		resolveDelete();
		await deletePromise;
	});

	await waitFor(() => {
		expect(screen.getByRole('status')).toHaveTextContent('Image deleted successfully.');
	});
	expect(listMyImagesMock).toHaveBeenCalledTimes(2);
	expect(screen.getByRole('button', { name: 'Delete image' })).not.toBeDisabled();
});

test('user-facing delete preserves error notice when delete fails', async () => {
	let rejectDelete: (error: Error) => void = () => undefined;
	const deletePromise = new Promise((_, reject) => {
		rejectDelete = reject;
	});
	deleteImageMock.mockReturnValue(deletePromise);
	renderGallery();

	fireEvent.click(screen.getByRole('button', { name: 'Delete image' }));

	await waitFor(() => expect(deleteImageMock).toHaveBeenCalledTimes(1));
	await act(async () => {
		rejectDelete(new Error('Delete failed'));
		try {
			await deletePromise;
		} catch {
			// Expected: the component catches this and shows the error notice.
		}
	});

	expect(await screen.findByRole('status')).toHaveTextContent('Delete failed');
	expect(listMyImagesMock).toHaveBeenCalledTimes(1);
	expect(mockFirestoreCollection).not.toHaveBeenCalled();
});

export {};
