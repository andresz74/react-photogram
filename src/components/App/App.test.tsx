import React from 'react';
import { render, screen } from '@testing-library/react';
import { App } from './App';

let mockAuthUser: { uid: string } | null = null;
let mockState = {
	auth: { uid: null as string | null },
	images: [] as unknown[],
	userImages: [] as unknown[],
	requestStatus: {
		auth: { status: 'idle', error: null as string | null },
		publicGallery: { status: 'idle', error: null as string | null },
		userGallery: { status: 'idle', error: null as string | null },
		upload: { status: 'idle', error: null as string | null },
	},
};

const mockDispatch = jest.fn((action: unknown) => action);
const mockSignOut = jest.fn();
const mockSignInWithEmailAndPassword = jest.fn();
const mockOnAuthStateChanged = jest.fn((callback: (user: { uid: string } | null) => void) => {
	callback(mockAuthUser);
	return jest.fn();
});
const mockInitializeAuthPersistence = jest.fn().mockResolvedValue(undefined);

jest.mock('state', () => {
	const actual = jest.requireActual('state');
	return {
		...actual,
		actionCreators: {
			loadImages: () => ({ type: 'LOAD_IMAGES', imgList: [] }),
			loadUserImages: () => ({ type: 'LOAD_USER_IMAGES', imgUserList: [] }),
			clearImages: () => ({ type: 'CLEAR_IMAGES' }),
			archiveImage: () => ({ type: 'ARCHIVE_IMAGE' }),
			togglePrivateImage: () => ({ type: 'TOGGLE_PRIVATE_IMAGE' }),
			deleteImage: () => ({ type: 'DELETE_IMAGE' }),
			setUserUID: (uid: string | null) => ({ type: 'SET_USER_UID', uid }),
			setAsyncStatus: () => ({ type: 'SET_ASYNC_STATUS', feature: 'auth', status: 'idle', error: null }),
		},
	};
});

jest.mock('react-redux', () => ({
	...jest.requireActual('react-redux'),
	useDispatch: () => mockDispatch,
	useSelector: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}));

jest.mock('firebase.configuration', () => ({
	auth: {
		onAuthStateChanged: (callback: (user: { uid: string } | null) => void) => mockOnAuthStateChanged(callback),
		signOut: () => mockSignOut(),
		signInWithEmailAndPassword: (email: string, password: string) => mockSignInWithEmailAndPassword(email, password),
	},
	initializeAuthPersistence: () => mockInitializeAuthPersistence(),
	db: {
		collection: jest.fn(() => ({
			add: jest.fn().mockResolvedValue({ id: 'mock-doc-id' }),
			doc: jest.fn(() => ({
				update: jest.fn().mockResolvedValue(undefined),
				delete: jest.fn().mockResolvedValue(undefined),
			})),
		})),
	},
	imagesDbCollection: 'imagesArray',
	usersDbCollection: 'usersArray',
}));

const renderAppAt = (path: string) => {
	window.history.pushState({}, '', path);
	return render(<App />);
};

beforeEach(() => {
	mockAuthUser = null;
	mockState = {
		auth: { uid: null },
		images: [],
		userImages: [],
		requestStatus: {
			auth: { status: 'idle', error: null },
			publicGallery: { status: 'idle', error: null },
			userGallery: { status: 'idle', error: null },
			upload: { status: 'idle', error: null },
		},
	};
	mockDispatch.mockClear();
	mockSignOut.mockClear();
	mockSignInWithEmailAndPassword.mockClear();
	mockInitializeAuthPersistence.mockClear();
	mockOnAuthStateChanged.mockClear();
	mockOnAuthStateChanged.mockImplementation((callback: (user: { uid: string } | null) => void) => {
		callback(mockAuthUser);
		return jest.fn();
	});
});

test('renders gallery route with empty-state message for signed-out users', async () => {
	renderAppAt('/');

	expect(await screen.findByText('Photogram')).toBeInTheDocument();
	expect(screen.getByText('No images available')).toBeInTheDocument();
	expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
	expect(screen.queryByRole('link', { name: 'Upload' })).not.toBeInTheDocument();
});

test('renders public gallery images from mapped backend image URLs', async () => {
	mockState.images = [
		{
			imgArchived: false,
			imgDescription: 'A backend image',
			imgId: 'image-1',
			imgLikes: 0,
			imgName: 'Backend image',
			imgPrivate: false,
			imgSrc: 'https://cdn.test/image-1.jpg',
			imgUploadDate: Date.parse('2026-06-22T12:00:00.000Z'),
			imgUserOwner: 'owner-1',
		},
	];

	renderAppAt('/');

	const image = await screen.findByRole('img', { name: 'Backend image' });
	expect(image).toHaveAttribute('src', 'https://cdn.test/image-1.jpg');
	expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
});

test('renders public gallery error state', async () => {
	mockState.requestStatus.publicGallery = {
		status: 'failed',
		error: 'Unable to load images: API unavailable',
	};

	renderAppAt('/');

	expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load images: API unavailable');
});

test('renders login route and login form fields', async () => {
	renderAppAt('/login');

	expect(await screen.findByPlaceholderText('Email')).toBeInTheDocument();
	expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
});

test('renders upload route guard notice for signed-out users', async () => {
	renderAppAt('/upload');

	expect(await screen.findByPlaceholderText('Email')).toBeInTheDocument();
	expect(window.location.pathname).toBe('/login');
	expect(window.location.search).toContain('next=%2Fupload');
});

test('redirects signed-out users from my gallery to login with next path', async () => {
	renderAppAt('/mygallery');

	expect(await screen.findByPlaceholderText('Email')).toBeInTheDocument();
	expect(window.location.pathname).toBe('/login');
	expect(window.location.search).toContain('next=%2Fmygallery');
});

test('renders my gallery empty state for authenticated users', async () => {
	mockAuthUser = { uid: 'user-123' };
	mockState.auth.uid = 'user-123';

	renderAppAt('/mygallery');

	expect(await screen.findByText('No images available')).toBeInTheDocument();
	expect(screen.getByText('Show Archived')).toBeInTheDocument();
});

test('renders my gallery images from mapped backend image URLs', async () => {
	mockAuthUser = { uid: 'user-123' };
	mockState.auth.uid = 'user-123';
	mockState.userImages = [
		{
			imgArchived: false,
			imgDescription: 'A backend user image',
			imgId: 'user-image-1',
			imgLikes: 0,
			imgName: 'My backend image',
			imgPrivate: true,
			imgSrc: 'https://cdn.test/user-image-1.jpg',
			imgUploadDate: Date.parse('2026-06-23T12:00:00.000Z'),
			imgUserOwner: 'user-123',
		},
	];

	renderAppAt('/mygallery');

	const image = await screen.findByRole('img', { name: 'My backend image' });
	expect(image).toHaveAttribute('src', 'https://cdn.test/user-image-1.jpg');
	expect(screen.getByText('Show Archived')).toBeInTheDocument();
});

test('renders my gallery error state', async () => {
	mockAuthUser = { uid: 'user-123' };
	mockState.auth.uid = 'user-123';
	mockState.requestStatus.userGallery = {
		status: 'failed',
		error: 'Unable to load images: API unavailable',
	};

	renderAppAt('/mygallery');

	expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load images: API unavailable');
});

test('shows authenticated menu items when auth user exists', async () => {
	mockAuthUser = { uid: 'user-123' };
	mockState.auth.uid = 'user-123';
	renderAppAt('/');

	expect(await screen.findByRole('link', { name: 'Upload' })).toBeInTheDocument();
	expect(screen.getByRole('link', { name: 'My Gallery' })).toBeInTheDocument();
	expect(screen.getByText('Sign out')).toBeInTheDocument();
	expect(screen.queryByRole('link', { name: 'Login' })).not.toBeInTheDocument();
});
