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
	const input = screen.getByLabelText('Choose an image to upload') as HTMLInputElement;
	fireEvent.change(input, { target: { files: [file] } });
};

const addTag = (tag: string) => {
	const input = screen.getByLabelText('Tags');
	fireEvent.change(input, { target: { value: tag } });
	fireEvent.keyDown(input, { key: 'Enter' });
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
	Object.defineProperty(URL, 'createObjectURL', {
		writable: true,
		value: createObjectURLMock,
	});
	Object.defineProperty(URL, 'revokeObjectURL', {
		writable: true,
		value: revokeObjectURLMock,
	});
	mockUid = 'user-123';
	mockCurrentUser = { getIdToken: jest.fn().mockResolvedValue('id-token-1') };
	mockDispatch.mockClear();
	mockFirestoreAdd.mockClear();
	mockCollection.mockClear();
	createObjectURLMock.mockClear();
	createObjectURLMock.mockReturnValue('blob:test-preview');
	revokeObjectURLMock.mockClear();
	uploadImageMock.mockReset();
	uploadImageMock.mockResolvedValue({
		id: 'image-1',
		ownerId: 'user-123',
		description: 'A backend upload',
		imageUrl: 'https://cdn.test/image-1.jpg',
		tags: ['dog', 'golden retriever'],
		tagSlugs: ['dog', 'golden-retriever'],
		isPublic: true,
		createdAt: '2026-06-23T12:00:00.000Z',
	});
});

test('initial state shows only the upload drop zone', () => {
	renderUpload();

	expect(screen.getByText('Click to upload')).toBeInTheDocument();
	expect(screen.getByText('or Drag & Drop')).toBeInTheDocument();
	expect(screen.getByText('Supported formats: .jpg, .jpeg, .png')).toBeInTheDocument();
	expect(screen.getByText('Maximum file size of 10MB.')).toBeInTheDocument();
	expect(screen.queryByLabelText('Description')).not.toBeInTheDocument();
	expect(screen.queryByLabelText('Tags')).not.toBeInTheDocument();
	expect(screen.queryByLabelText('Private')).not.toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Upload' })).not.toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument();
	expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});

test('selecting a valid file shows preview, metadata fields, and upload actions', async () => {
	const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
	renderUpload();

	selectFile(file);

	expect(createObjectURLMock).toHaveBeenCalledWith(file);
	expect(await screen.findByAltText('photo.jpg')).toHaveAttribute('src', 'blob:test-preview');
	expect(screen.getByText('Change file')).toBeInTheDocument();
	expect(screen.getByText('photo.jpg')).toBeInTheDocument();
	expect(screen.getByText('0.00 MB · image/jpeg')).toBeInTheDocument();
	expect(screen.getByLabelText('Description')).toBeInTheDocument();
	expect(screen.getByLabelText('Tags')).toBeInTheDocument();
	expect(screen.getByText('Press Enter to add a tag. Spaces are okay.')).toBeInTheDocument();
	expect(screen.getByText('0/10 tags')).toBeInTheDocument();
	expect(screen.getByLabelText('Private')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Upload' })).toBeEnabled();
	expect(screen.getByRole('button', { name: 'Reset' })).toBeEnabled();
	expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});

test('reset returns the upload modal to the initial state', () => {
	const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
	renderUpload();

	selectFile(file);
	fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Temporary description' } });
	addTag('dog');
	fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

	expect(screen.getByText('Click to upload')).toBeInTheDocument();
	expect(screen.queryByAltText('photo.jpg')).not.toBeInTheDocument();
	expect(screen.queryByLabelText('Description')).not.toBeInTheDocument();
	expect(screen.queryByText('dog')).not.toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Upload' })).not.toBeInTheDocument();
});

test('uploading state disables mutable controls and shows progress feedback only while uploading', async () => {
	const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
	uploadImageMock.mockImplementation(() => new Promise(() => undefined));
	renderUpload();

	selectFile(file);
	fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

	expect(await screen.findByRole('button', { name: /Uploading/ })).toBeDisabled();
	expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled();
	expect(screen.getByLabelText('Choose an image to upload')).toBeDisabled();
	expect(screen.getByLabelText('Description')).toBeDisabled();
	expect(screen.getByLabelText('Tags')).toBeDisabled();
	expect(screen.getByLabelText('Private')).toBeDisabled();
	expect(screen.getByRole('progressbar')).toBeInTheDocument();
});

test('success state shows confirmation, open image, and upload another without stale form fields', async () => {
	const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
	renderUpload();

	selectFile(file);
	fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'A backend upload' } });
	fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

	expect(await screen.findByText('Uploaded')).toBeInTheDocument();
	expect(screen.getByRole('link', { name: 'Open image' })).toHaveAttribute('href', 'https://cdn.test/image-1.jpg');
	expect(screen.getByLabelText('Uploaded tags')).toHaveTextContent('dog');
	expect(screen.getByLabelText('Uploaded tags')).toHaveTextContent('golden retriever');
	expect(screen.getByRole('button', { name: 'Upload another' })).toBeInTheDocument();
	expect(screen.queryByLabelText('Description')).not.toBeInTheDocument();
	expect(screen.queryByLabelText('Tags')).not.toBeInTheDocument();
	expect(screen.queryByLabelText('Private')).not.toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Upload' })).not.toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument();

	fireEvent.click(screen.getByRole('button', { name: 'Upload another' }));
	expect(screen.getByText('Click to upload')).toBeInTheDocument();
	expect(screen.queryByText('Uploaded')).not.toBeInTheDocument();
});

test('success state handles empty returned tags without rendering uploaded tags', async () => {
	const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
	uploadImageMock.mockResolvedValue({
		id: 'image-1',
		imageUrl: 'https://cdn.test/image-1.jpg',
		tags: [],
		tagSlugs: [],
		isPublic: true,
		createdAt: '2026-06-23T12:00:00.000Z',
	});
	renderUpload();

	selectFile(file);
	addTag('local-only');
	fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

	expect(await screen.findByText('Uploaded')).toBeInTheDocument();
	expect(screen.queryByLabelText('Uploaded tags')).not.toBeInTheDocument();
});

test('success state handles missing returned tags defensively', async () => {
	const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
	uploadImageMock.mockResolvedValue({
		id: 'image-1',
		imageUrl: 'https://cdn.test/image-1.jpg',
		isPublic: true,
		createdAt: '2026-06-23T12:00:00.000Z',
	});
	renderUpload();

	selectFile(file);
	addTag('local-only');
	fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

	expect(await screen.findByText('Uploaded')).toBeInTheDocument();
	expect(screen.queryByLabelText('Uploaded tags')).not.toBeInTheDocument();
});

test('change file preserves description tags and privacy', async () => {
	const firstFile = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
	const replacementFile = new File(['replacement'], 'replacement.jpg', { type: 'image/jpeg' });
	renderUpload();

	selectFile(firstFile);
	fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Keep this description' } });
	addTag('dog');
	fireEvent.click(screen.getByLabelText('Private'));
	selectFile(replacementFile);

	expect(await screen.findByAltText('replacement.jpg')).toBeInTheDocument();
	expect(screen.getByLabelText('Description')).toHaveValue('Keep this description');
	expect(screen.getByText('dog')).toBeInTheDocument();
	expect(screen.getByLabelText('Private')).toBeChecked();
});

test('backend validation error is displayed and user can edit tags and retry', async () => {
	const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
	uploadImageMock
		.mockRejectedValueOnce(new Error('Invalid tags: too many tags.'))
		.mockResolvedValueOnce({
			id: 'image-1',
			imageUrl: 'https://cdn.test/image-1.jpg',
			tags: ['dog'],
			tagSlugs: ['dog'],
			isPublic: true,
			createdAt: '2026-06-23T12:00:00.000Z',
		});
	renderUpload();

	selectFile(file);
	addTag('dog');
	addTag('cat');
	fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

	expect(await screen.findByRole('alert')).toHaveTextContent('Invalid tags: too many tags.');
	expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
	expect(screen.getByLabelText('Tags')).toBeEnabled();

	fireEvent.click(screen.getByRole('button', { name: 'Remove tag cat' }));
	fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

	await waitFor(() => expect(uploadImageMock).toHaveBeenCalledTimes(2));
	expect(await screen.findByText('Uploaded')).toBeInTheDocument();
	expect(screen.getByLabelText('Uploaded tags')).toHaveTextContent('dog');
});

test('invalid file type shows an error and does not show upload controls', () => {
	const file = new File(['not image'], 'notes.txt', { type: 'text/plain' });
	renderUpload();

	selectFile(file);

	expect(screen.getByRole('alert')).toHaveTextContent('Please choose an image file.');
	expect(screen.queryByLabelText('Description')).not.toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Upload' })).not.toBeInTheDocument();
	expect(uploadImageMock).not.toHaveBeenCalled();
});

test('empty image file shows an error and does not show upload controls', () => {
	const file = new File([], 'empty.jpg', { type: 'image/jpeg' });
	renderUpload();

	selectFile(file);

	expect(screen.getByRole('alert')).toHaveTextContent('Please choose a non-empty image file.');
	expect(screen.queryByLabelText('Description')).not.toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Upload' })).not.toBeInTheDocument();
	expect(uploadImageMock).not.toHaveBeenCalled();
});

test('oversized file shows an error and does not show upload controls', () => {
	const file = new File([new ArrayBuffer(10 * 1024 * 1024 + 1)], 'large.jpg', { type: 'image/jpeg' });
	renderUpload();

	selectFile(file);

	expect(screen.getByRole('alert')).toHaveTextContent('File is too large (max 10MB).');
	expect(screen.queryByLabelText('Description')).not.toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Upload' })).not.toBeInTheDocument();
	expect(uploadImageMock).not.toHaveBeenCalled();
});

test('upload flow obtains an ID token and calls canonical uploadImage input', async () => {
	const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
	renderUpload();

	selectFile(file);
	fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'A backend upload' } });
	addTag('dog');
	addTag('golden retriever');
	addTag('New York');
	fireEvent.click(screen.getByLabelText('Private'));
	fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

	await waitFor(() => expect(uploadImageMock).toHaveBeenCalledTimes(1));

	expect(mockCurrentUser?.getIdToken).toHaveBeenCalledWith();
	expect(uploadImageMock).toHaveBeenCalledWith({
		file,
		idToken: 'id-token-1',
		description: 'A backend upload',
		isPublic: false,
		tags: ['dog', 'golden retriever', 'New York'],
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
	expect(uploadImageMock.mock.calls[0][0]).not.toHaveProperty('tags');
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
