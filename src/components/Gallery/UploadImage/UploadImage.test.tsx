import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { uploadImage } from 'api';
import { UploadImage } from './UploadImage';

let mockUid: string | null = 'user-123';
let mockCurrentUser: { getIdToken: jest.Mock } | null = null;
const mockDispatch = jest.fn();
const mockFirestoreAdd = jest.fn();
const mockCollection = jest.fn((collectionName?: string) => ({
	collectionName,
	add: mockFirestoreAdd,
}));

jest.mock('api', () => ({
	uploadImage: jest.fn(),
}));

jest.mock('firebase.configuration', () => ({
	auth: {
		get currentUser() {
			return mockCurrentUser;
		},
	},
	db: {
		collection: (collectionName: string) => mockCollection(collectionName),
	},
	imagesDbCollection: 'imagesArray',
}));

jest.mock('react-redux', () => ({
	useDispatch: () => mockDispatch,
	useSelector: (selector: (state: { auth: { uid: string | null } }) => unknown) => selector({ auth: { uid: mockUid } }),
}));

jest.mock('state', () => ({
	actionCreators: {
		setAsyncStatus: (feature: string, status: string, error: string | null = null) => ({
			type: 'SET_ASYNC_STATUS',
			feature,
			status,
			error,
		}),
	},
}));

const uploadImageMock = uploadImage as jest.Mock;
const createObjectURLMock = jest.fn(() => 'blob:test-preview');
const revokeObjectURLMock = jest.fn();

const renderUpload = () => render(
	<MemoryRouter>
		<UploadImage />
	</MemoryRouter>,
);

const selectFile = (file: File) => {
	const input = document.querySelector('input[type="file"]') as HTMLInputElement;
	fireEvent.change(input, { target: { files: [file] } });
};

beforeAll(() => {
	Object.defineProperty(URL, 'createObjectURL', {
		writable: true,
		value: createObjectURLMock,
	});
	Object.defineProperty(URL, 'revokeObjectURL', {
		writable: true,
		value: revokeObjectURLMock,
	});
});

beforeEach(() => {
	mockUid = 'user-123';
	mockCurrentUser = { getIdToken: jest.fn().mockResolvedValue('id-token-1') };
	mockDispatch.mockClear();
	mockFirestoreAdd.mockClear();
	mockCollection.mockClear();
	createObjectURLMock.mockClear();
	revokeObjectURLMock.mockClear();
	uploadImageMock.mockReset();
	uploadImageMock.mockResolvedValue({
		id: 'image-1',
		ownerId: 'user-123',
		description: 'A backend upload',
		imageUrl: 'https://cdn.test/image-1.jpg',
		isPublic: true,
		createdAt: '2026-06-23T12:00:00.000Z',
	});
});

test('upload flow obtains an ID token and calls canonical uploadImage input', async () => {
	const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
	renderUpload();

	selectFile(file);
	fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'A backend upload' } });
	fireEvent.click(screen.getByLabelText('Private'));
	fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

	await waitFor(() => expect(uploadImageMock).toHaveBeenCalledTimes(1));

	expect(mockCurrentUser?.getIdToken).toHaveBeenCalledWith();
	expect(uploadImageMock).toHaveBeenCalledWith({
		file,
		idToken: 'id-token-1',
		description: 'A backend upload',
		isPublic: false,
	});
	expect(uploadImageMock.mock.calls[0][0]).not.toBe(file);
	expect(mockFirestoreAdd).not.toHaveBeenCalled();
	expect(mockCollection).not.toHaveBeenCalled();
	expect(await screen.findByText('Uploaded')).toBeInTheDocument();
	expect(screen.getByRole('link', { name: 'Open image' })).toHaveAttribute('href', 'https://cdn.test/image-1.jpg');
});

test('upload flow preserves public default privacy', async () => {
	const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
	renderUpload();

	selectFile(file);
	fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

	await waitFor(() => expect(uploadImageMock).toHaveBeenCalledTimes(1));

	expect(uploadImageMock.mock.calls[0][0]).toMatchObject({
		file,
		idToken: 'id-token-1',
		isPublic: true,
	});
});

test('upload flow fails when Firebase current user is missing', async () => {
	const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
	mockCurrentUser = null;
	renderUpload();

	selectFile(file);
	fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

	expect(await screen.findByRole('alert')).toHaveTextContent('Please log in to upload images.');
	expect(uploadImageMock).not.toHaveBeenCalled();
	expect(mockFirestoreAdd).not.toHaveBeenCalled();
});

test('upload flow surfaces token retrieval failures', async () => {
	const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
	mockCurrentUser = { getIdToken: jest.fn().mockRejectedValue(new Error('Token unavailable')) };
	renderUpload();

	selectFile(file);
	fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

	expect(await screen.findByRole('alert')).toHaveTextContent('Token unavailable');
	expect(uploadImageMock).not.toHaveBeenCalled();
	expect(mockFirestoreAdd).not.toHaveBeenCalled();
});

test('upload flow surfaces API upload failures', async () => {
	const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
	uploadImageMock.mockRejectedValue(new Error('Upload failed'));
	renderUpload();

	selectFile(file);
	fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

	expect(await screen.findByRole('alert')).toHaveTextContent('Upload failed');
	expect(mockFirestoreAdd).not.toHaveBeenCalled();
});

export {};
