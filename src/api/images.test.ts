const mockCollection = jest.fn(() => ({
	where: jest.fn().mockReturnThis(),
	get: jest.fn(),
	doc: jest.fn(() => ({
		update: jest.fn().mockResolvedValue(undefined),
		delete: jest.fn().mockResolvedValue(undefined),
	})),
}));

jest.mock('firebase.configuration', () => ({
	auth: {
		currentUser: null,
	},
	db: {
		collection: mockCollection,
	},
	imagesDbCollection: 'imagesArray',
}));

const {
	ApiError,
	archiveImageById,
	archiveImage,
	deleteImage,
	getPublicImages,
	getUserImages,
	listMyImages,
	listPublicImages,
	setImagePrivacy,
	unarchiveImageById,
	updateImageVisibility,
	uploadImage,
} = require('./images') as typeof import('./images');

type MockResponseInput = {
	ok?: boolean;
	status?: number;
	body?: unknown;
	bodyText?: string;
};

const makeResponse = ({ ok = true, status = 200, body = {}, bodyText }: MockResponseInput = {}) => ({
	ok,
	status,
	text: jest.fn().mockResolvedValue(bodyText ?? JSON.stringify(body)),
});

const fetchMock = () => global.fetch as jest.Mock;

const originalApiUrl = process.env.REACT_APP_API_URL;

beforeEach(() => {
	process.env.REACT_APP_API_URL = 'http://api.test';
	global.fetch = jest.fn().mockResolvedValue(makeResponse({ body: { images: [] } })) as jest.Mock;
});

afterEach(() => {
	jest.clearAllMocks();
	if (originalApiUrl === undefined) {
		delete process.env.REACT_APP_API_URL;
	} else {
		process.env.REACT_APP_API_URL = originalApiUrl;
	}
});

test('builds URL from REACT_APP_API_URL', async () => {
	process.env.REACT_APP_API_URL = 'https://photogram-api.example.com';

	await listPublicImages();

	expect(fetchMock()).toHaveBeenCalledWith('https://photogram-api.example.com/images/public', {
		method: 'GET',
	});
});

test('removes trailing slash from API URL', async () => {
	process.env.REACT_APP_API_URL = 'https://photogram-api.example.com/';

	await listPublicImages();

	expect(fetchMock()).toHaveBeenCalledWith('https://photogram-api.example.com/images/public', {
		method: 'GET',
	});
});

test('listPublicImages calls GET /images/public without Authorization', async () => {
	await listPublicImages();

	expect(fetchMock()).toHaveBeenCalledWith('http://api.test/images/public', {
		method: 'GET',
	});
	const init = fetchMock().mock.calls[0][1] as RequestInit;
	expect(init.headers).toBeUndefined();
});

test('listPublicImages adds limit and offset query params', async () => {
	await listPublicImages({ limit: 10, offset: 20 });

	expect(fetchMock()).toHaveBeenCalledWith('http://api.test/images/public?limit=10&offset=20', {
		method: 'GET',
	});
});

test('listPublicImages omits query params when missing', async () => {
	await listPublicImages();

	expect(fetchMock().mock.calls[0][0]).toBe('http://api.test/images/public');
});

test('listPublicImages returns images from response images array', async () => {
	const images = [
		{
			id: 'image-1',
			imageUrl: 'https://cdn.test/image-1.jpg',
			isPublic: true,
			createdAt: '2026-06-22T00:00:00.000Z',
		},
	];
	global.fetch = jest.fn().mockResolvedValue(makeResponse({ body: { images } })) as jest.Mock;

	await expect(listPublicImages()).resolves.toEqual(images);
});

test('listMyImages requires idToken', async () => {
	await expect(listMyImages({ idToken: '' })).rejects.toThrow(ApiError);

	expect(fetchMock()).not.toHaveBeenCalled();
});

test('listMyImages sends Authorization header and calls GET /images/me', async () => {
	await listMyImages({ idToken: 'token-1', limit: 3, offset: 0 });

	expect(fetchMock()).toHaveBeenCalledWith('http://api.test/images/me?limit=3&offset=0', {
		method: 'GET',
		headers: {
			Authorization: 'Bearer token-1',
		},
	});
});

test('listMyImages sends archived query param only when true', async () => {
	await listMyImages({ idToken: 'token-1', archived: true });

	expect(fetchMock()).toHaveBeenCalledWith('http://api.test/images/me?archived=true', {
		method: 'GET',
		headers: {
			Authorization: 'Bearer token-1',
		},
	});
});

test('listMyImages sends includeArchived query param only when true', async () => {
	await listMyImages({ idToken: 'token-1', includeArchived: true });

	expect(fetchMock()).toHaveBeenCalledWith('http://api.test/images/me?includeArchived=true', {
		method: 'GET',
		headers: {
			Authorization: 'Bearer token-1',
		},
	});
});

test('listMyImages omits false archived and includeArchived query params', async () => {
	await listMyImages({ idToken: 'token-1', archived: false, includeArchived: false });

	expect(fetchMock()).toHaveBeenCalledWith('http://api.test/images/me', {
		method: 'GET',
		headers: {
			Authorization: 'Bearer token-1',
		},
	});
});

test('uploadImage requires file', async () => {
	await expect(uploadImage({ file: undefined as unknown as File, idToken: 'token-1' })).rejects.toThrow(ApiError);

	expect(fetchMock()).not.toHaveBeenCalled();
});

test('uploadImage requires idToken', async () => {
	const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });

	await expect(uploadImage({ file, idToken: '' })).rejects.toThrow(ApiError);

	expect(fetchMock()).not.toHaveBeenCalled();
});

test('uploadImage calls POST /images with Authorization and FormData body', async () => {
	const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
	global.fetch = jest.fn().mockResolvedValue(makeResponse({
		body: {
			image: {
				id: 'image-1',
				imageUrl: 'https://cdn.test/image-1.jpg',
				isPublic: false,
				createdAt: '2026-06-22T00:00:00.000Z',
			},
		},
	})) as jest.Mock;

	await uploadImage({
		file,
		idToken: 'token-1',
		title: 'Title',
		description: 'Description',
		isPublic: false,
	});

	expect(fetchMock()).toHaveBeenCalledTimes(1);
	const [url, init] = fetchMock().mock.calls[0] as [string, RequestInit];
	const body = init.body as FormData;
	expect(url).toBe('http://api.test/images');
	expect(init.method).toBe('POST');
	expect(init.headers).toEqual({ Authorization: 'Bearer token-1' });
	expect(body).toBeInstanceOf(FormData);
	expect(body.get('image')).toBe(file);
	expect(body.get('title')).toBe('Title');
	expect(body.get('description')).toBe('Description');
	expect(body.get('isPublic')).toBe('false');
	expect(init.headers).not.toHaveProperty('Content-Type');
});

test('uploadImage appends isPublic as true string when provided', async () => {
	const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
	global.fetch = jest.fn().mockResolvedValue(makeResponse({
		body: {
			image: {
				id: 'image-1',
				imageUrl: 'https://cdn.test/image-1.jpg',
				isPublic: true,
				createdAt: '2026-06-22T00:00:00.000Z',
			},
		},
	})) as jest.Mock;

	await uploadImage({ file, idToken: 'token-1', isPublic: true });

	const init = fetchMock().mock.calls[0][1] as RequestInit;
	expect((init.body as FormData).get('isPublic')).toBe('true');
});

test('uploadImage returns image from response image object', async () => {
	const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
	const image = {
		id: 'image-1',
		imageUrl: 'https://cdn.test/image-1.jpg',
		isPublic: true,
		createdAt: '2026-06-22T00:00:00.000Z',
	};
	global.fetch = jest.fn().mockResolvedValue(makeResponse({ body: { image } })) as jest.Mock;

	await expect(uploadImage({ file, idToken: 'token-1' })).resolves.toEqual(image);
});

test('deleteImage requires imageId', async () => {
	await expect(deleteImage({ imageId: '', idToken: 'token-1' })).rejects.toThrow(ApiError);

	expect(fetchMock()).not.toHaveBeenCalled();
});

test('deleteImage requires idToken', async () => {
	await expect(deleteImage({ imageId: 'image-1', idToken: '' })).rejects.toThrow(ApiError);

	expect(fetchMock()).not.toHaveBeenCalled();
});

test('deleteImage calls DELETE /images/:imageId with encoded id and Authorization', async () => {
	const result = { imageId: 'folder/image 1', deleted: true };
	global.fetch = jest.fn().mockResolvedValue(makeResponse({ body: result })) as jest.Mock;

	await expect(deleteImage({ imageId: 'folder/image 1', idToken: 'token-1' })).resolves.toEqual(result);

	expect(fetchMock()).toHaveBeenCalledWith('http://api.test/images/folder%2Fimage%201', {
		method: 'DELETE',
		headers: {
			Authorization: 'Bearer token-1',
		},
	});
});

test('updateImageVisibility requires imageId', async () => {
	await expect(updateImageVisibility({ imageId: '', idToken: 'token-1', isPublic: true })).rejects.toThrow(ApiError);

	expect(fetchMock()).not.toHaveBeenCalled();
});

test('updateImageVisibility requires idToken', async () => {
	await expect(updateImageVisibility({ imageId: 'image-1', idToken: '', isPublic: true })).rejects.toThrow(ApiError);

	expect(fetchMock()).not.toHaveBeenCalled();
});

test('updateImageVisibility requires boolean isPublic', async () => {
	await expect(updateImageVisibility({
		imageId: 'image-1',
		idToken: 'token-1',
		isPublic: undefined as unknown as boolean,
	})).rejects.toThrow(ApiError);

	expect(fetchMock()).not.toHaveBeenCalled();
});

test('updateImageVisibility calls PATCH visibility endpoint with encoded id, auth, and JSON body', async () => {
	const image = {
		id: 'folder/image 1',
		imageUrl: 'https://cdn.test/image-1.jpg',
		isPublic: false,
		createdAt: '2026-06-22T00:00:00.000Z',
	};
	global.fetch = jest.fn().mockResolvedValue(makeResponse({ body: { image } })) as jest.Mock;

	await expect(updateImageVisibility({
		imageId: 'folder/image 1',
		idToken: 'token-1',
		isPublic: false,
	})).resolves.toEqual(image);

	expect(fetchMock()).toHaveBeenCalledWith('http://api.test/images/folder%2Fimage%201/visibility', {
		method: 'PATCH',
		headers: {
			Authorization: 'Bearer token-1',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ isPublic: false }),
	});
});

test('archiveImageById requires imageId', async () => {
	await expect(archiveImageById({ imageId: '', idToken: 'token-1' })).rejects.toThrow(ApiError);

	expect(fetchMock()).not.toHaveBeenCalled();
});

test('archiveImageById requires idToken', async () => {
	await expect(archiveImageById({ imageId: 'image-1', idToken: '' })).rejects.toThrow(ApiError);

	expect(fetchMock()).not.toHaveBeenCalled();
});

test('archiveImageById calls POST archive endpoint with Authorization and returns image', async () => {
	const image = {
		id: 'folder/image 1',
		imageUrl: 'https://cdn.test/image-1.jpg',
		isPublic: false,
		isArchived: true,
		createdAt: '2026-06-22T00:00:00.000Z',
	};
	global.fetch = jest.fn().mockResolvedValue(makeResponse({ body: { image } })) as jest.Mock;

	await expect(archiveImageById({ imageId: 'folder/image 1', idToken: 'token-1' })).resolves.toEqual(image);

	expect(fetchMock()).toHaveBeenCalledWith('http://api.test/images/folder%2Fimage%201/archive', {
		method: 'POST',
		headers: {
			Authorization: 'Bearer token-1',
		},
	});
});

test('unarchiveImageById calls POST unarchive endpoint with Authorization and returns image', async () => {
	const image = {
		id: 'folder/image 1',
		imageUrl: 'https://cdn.test/image-1.jpg',
		isPublic: false,
		isArchived: false,
		createdAt: '2026-06-22T00:00:00.000Z',
	};
	global.fetch = jest.fn().mockResolvedValue(makeResponse({ body: { image } })) as jest.Mock;

	await expect(unarchiveImageById({ imageId: 'folder/image 1', idToken: 'token-1' })).resolves.toEqual(image);

	expect(fetchMock()).toHaveBeenCalledWith('http://api.test/images/folder%2Fimage%201/unarchive', {
		method: 'POST',
		headers: {
			Authorization: 'Bearer token-1',
		},
	});
});

test('non-2xx JSON response throws ApiError', async () => {
	global.fetch = jest.fn().mockResolvedValue(makeResponse({
		ok: false,
		status: 400,
		body: { message: 'Invalid request', code: 'invalid_request', details: { field: 'limit' } },
	})) as jest.Mock;

	await expect(listPublicImages()).rejects.toMatchObject({
		name: 'ApiError',
		status: 400,
		code: 'invalid_request',
		message: 'Invalid request',
		details: { field: 'limit' },
	});
});

test('non-2xx non-JSON response throws ApiError', async () => {
	global.fetch = jest.fn().mockResolvedValue(makeResponse({
		ok: false,
		status: 500,
		bodyText: 'server unavailable',
	})) as jest.Mock;

	await expect(listPublicImages()).rejects.toMatchObject({
		name: 'ApiError',
		status: 500,
		message: 'Request failed with HTTP 500.',
	});
});

test('validation failures do not call fetch', async () => {
	await expect(listPublicImages({ limit: 0 })).rejects.toThrow(ApiError);
	await expect(listPublicImages({ offset: -1 })).rejects.toThrow(ApiError);

	delete process.env.REACT_APP_API_URL;
	await expect(listPublicImages()).rejects.toThrow(ApiError);

	expect(fetchMock()).not.toHaveBeenCalled();
});

test('existing legacy exports still exist', () => {
	expect(typeof getPublicImages).toBe('function');
	expect(typeof getUserImages).toBe('function');
	expect(typeof archiveImage).toBe('function');
	expect(typeof archiveImageById).toBe('function');
	expect(typeof setImagePrivacy).toBe('function');
	expect(typeof unarchiveImageById).toBe('function');
	expect(typeof updateImageVisibility).toBe('function');
	expect(typeof uploadImage).toBe('function');
	expect(typeof deleteImage).toBe('function');
});

export {};
