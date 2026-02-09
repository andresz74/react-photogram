import React from 'react';
import { render, screen } from '@testing-library/react';
import { App } from './App';

let mockAuthUser: { uid: string } | null = null;
let mockState = {
	auth: { uid: null as string | null },
	images: [] as unknown[],
	userImages: [] as unknown[],
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
			setUserUID: (uid: string | null) => ({ type: 'SET_USER_UID', uid }),
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

test('renders login route and login form fields', async () => {
	renderAppAt('/login');

	expect(await screen.findByPlaceholderText('Email')).toBeInTheDocument();
	expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
});

test('renders upload route guard notice for signed-out users', async () => {
	renderAppAt('/upload');

	expect(await screen.findByText('You must be logged in to upload images.')).toBeInTheDocument();
	expect(screen.getByRole('link', { name: 'Go to Login' })).toBeInTheDocument();
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
