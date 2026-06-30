import type firebase from 'firebase/app';
import { auth, db, imagesDbCollection } from 'firebase.configuration';
import { ImageInterface } from 'type';
import config from '../config';
import { logger } from 'utils/logger';

// Firestore reference
const imagesRef = db.collection(imagesDbCollection);

type UploadApiResponse = { url?: string };
type FirestoreTimestampLike = { toMillis: () => number };
type LegacyUploadOptions = {
	onProgress?: (percent: number) => void;
	onStage?: (stage: 'uploading' | 'processing') => void;
};
type ApiErrorBody = {
	error?: unknown;
	message?: unknown;
	code?: unknown;
	details?: unknown;
};

export interface PhotogramImage {
	id: string;
	ownerId?: string;
	title?: string;
	description?: string;
	imageUrl: string;
	thumbnailUrl?: string;
	width?: number;
	height?: number;
	sizeBytes?: number;
	mimeType?: string;
	isPublic: boolean;
	isArchived?: boolean;
	archivedAt?: string;
	tags?: string[];
	tagSlugs?: string[];
	createdAt: string;
	updatedAt?: string;
}

export interface PaginationOptions {
	limit?: number;
	offset?: number;
}

export interface UploadImageInput {
	file: File;
	idToken: string;
	title?: string;
	description?: string;
	isPublic?: boolean;
	tags?: string[];
}

export interface AuthenticatedImageRequest {
	idToken: string;
	limit?: number;
	offset?: number;
	archived?: boolean;
	includeArchived?: boolean;
}

export interface DeleteImageInput {
	imageId: string;
	idToken: string;
}

export interface DeleteImageResult {
	imageId: string;
	deleted: boolean;
}

export interface UpdateImageVisibilityInput {
	imageId: string;
	idToken: string;
	isPublic: boolean;
}

export interface ArchiveImageInput {
	imageId: string;
	idToken: string;
}

export class ApiError extends Error {
	status: number;
	code?: string;
	details?: unknown;

	constructor(status: number, message: string, code?: string, details?: unknown) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.code = code;
		this.details = details;
		Object.setPrototypeOf(this, ApiError.prototype);
	}
}

const getApiBaseUrl = () => {
	const apiBaseUrl = process.env.REACT_APP_API_URL?.trim() ?? '';

	if (!apiBaseUrl) {
		throw new ApiError(0, 'REACT_APP_API_URL is required to call the Photogram API.', 'missing_api_url');
	}

	return apiBaseUrl.replace(/\/+$/, '');
};

const assertIdToken = (idToken: string) => {
	if (!idToken?.trim()) {
		throw new ApiError(0, 'An idToken is required for this request.', 'missing_id_token');
	}
};

const assertImageId = (imageId: string, action: string) => {
	if (!imageId?.trim()) {
		throw new ApiError(0, `imageId is required to ${action} an image.`, 'missing_image_id');
	}
};

const assertBoolean = (value: unknown, fieldName: string) => {
	if (typeof value !== 'boolean') {
		throw new ApiError(0, `${fieldName} must be a boolean.`, `invalid_${fieldName}`);
	}
};

const assertPagination = (options?: PaginationOptions) => {
	if (options?.limit !== undefined && (!Number.isInteger(options.limit) || options.limit <= 0)) {
		throw new ApiError(0, 'limit must be a positive integer.', 'invalid_limit');
	}

	if (options?.offset !== undefined && (!Number.isInteger(options.offset) || options.offset < 0)) {
		throw new ApiError(0, 'offset must be a non-negative integer.', 'invalid_offset');
	}
};

const buildApiUrl = (path: string, options?: PaginationOptions & { archived?: boolean; includeArchived?: boolean }) => {
	assertPagination(options);

	const url = new URL(`${getApiBaseUrl()}${path}`);
	if (options?.limit !== undefined) url.searchParams.set('limit', String(options.limit));
	if (options?.offset !== undefined) url.searchParams.set('offset', String(options.offset));
	if (options?.archived === true) url.searchParams.set('archived', 'true');
	if (options?.includeArchived === true) url.searchParams.set('includeArchived', 'true');
	return url.toString();
};

const parseJsonBody = async (response: Response): Promise<unknown> => {
	const bodyText = await response.text();
	if (!bodyText) return {};

	try {
		return JSON.parse(bodyText);
	} catch {
		return undefined;
	}
};

const isApiErrorBody = (body: unknown): body is ApiErrorBody =>
	Boolean(body && typeof body === 'object');

const getApiErrorMessage = (body: unknown, status: number) => {
	if (!isApiErrorBody(body)) return `Request failed with HTTP ${status}.`;

	if (typeof body.message === 'string' && body.message.trim()) return body.message;
	if (typeof body.error === 'string' && body.error.trim()) return body.error;

	if (body.error && typeof body.error === 'object') {
		const nested = body.error as ApiErrorBody;
		if (typeof nested.message === 'string' && nested.message.trim()) return nested.message;
		if (typeof nested.code === 'string' && nested.code.trim()) return nested.code;
	}

	if (typeof body.code === 'string' && body.code.trim()) return body.code;
	return `Request failed with HTTP ${status}.`;
};

const getApiErrorCode = (body: unknown) => {
	if (!isApiErrorBody(body)) return undefined;
	if (typeof body.code === 'string') return body.code;
	if (body.error && typeof body.error === 'object') {
		const nested = body.error as ApiErrorBody;
		if (typeof nested.code === 'string') return nested.code;
	}
	return undefined;
};

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
	const response = await fetch(url, init);
	const body = await parseJsonBody(response);

	if (!response.ok) {
		throw new ApiError(response.status, getApiErrorMessage(body, response.status), getApiErrorCode(body), isApiErrorBody(body) ? body.details : body);
	}

	return body as T;
};

export const listPublicImages = async (options?: PaginationOptions): Promise<PhotogramImage[]> => {
	const response = await requestJson<{ images?: PhotogramImage[] }>(buildApiUrl('/images/public', options), {
		method: 'GET',
	});

	return response.images ?? [];
};

export const listMyImages = async (input: AuthenticatedImageRequest): Promise<PhotogramImage[]> => {
	assertIdToken(input.idToken);

	const response = await requestJson<{ images?: PhotogramImage[] }>(
		buildApiUrl('/images/me', {
			limit: input.limit,
			offset: input.offset,
			archived: input.archived,
			includeArchived: input.includeArchived,
		}),
		{
			method: 'GET',
			headers: {
				Authorization: `Bearer ${input.idToken}`,
			},
		},
	);

	return response.images ?? [];
};

const uploadPhotogramImage = async (input: UploadImageInput): Promise<PhotogramImage> => {
	if (!input.file) {
		throw new ApiError(0, 'A file is required to upload an image.', 'missing_file');
	}

	assertIdToken(input.idToken);

	const formData = new FormData();
	formData.append('image', input.file);
	if (input.title !== undefined) formData.append('title', input.title);
	if (input.description !== undefined) formData.append('description', input.description);
	if (input.isPublic !== undefined) formData.append('isPublic', String(input.isPublic));
	if (input.tags !== undefined) formData.append('tags', JSON.stringify(input.tags));

	const response = await requestJson<{ image?: PhotogramImage }>(buildApiUrl('/images'), {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${input.idToken}`,
		},
		body: formData,
	});

	if (!response.image) {
		throw new ApiError(0, 'Upload response did not include an image.', 'invalid_upload_response');
	}

	return response.image;
};

const deletePhotogramImage = async (input: DeleteImageInput): Promise<DeleteImageResult> => {
	assertImageId(input.imageId, 'delete');
	assertIdToken(input.idToken);

	return requestJson<DeleteImageResult>(buildApiUrl(`/images/${encodeURIComponent(input.imageId)}`), {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${input.idToken}`,
		},
	});
};

export const updateImageVisibility = async (input: UpdateImageVisibilityInput): Promise<PhotogramImage> => {
	assertImageId(input.imageId, 'update');
	assertIdToken(input.idToken);
	assertBoolean(input.isPublic, 'isPublic');

	const response = await requestJson<{ image?: PhotogramImage }>(
		buildApiUrl(`/images/${encodeURIComponent(input.imageId)}/visibility`),
		{
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${input.idToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ isPublic: input.isPublic }),
		},
	);

	if (!response.image) {
		throw new ApiError(0, 'Visibility response did not include an image.', 'invalid_visibility_response');
	}

	return response.image;
};

export const archiveImageById = async (input: ArchiveImageInput): Promise<PhotogramImage> => {
	assertImageId(input.imageId, 'archive');
	assertIdToken(input.idToken);

	const response = await requestJson<{ image?: PhotogramImage }>(
		buildApiUrl(`/images/${encodeURIComponent(input.imageId)}/archive`),
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${input.idToken}`,
			},
		},
	);

	if (!response.image) {
		throw new ApiError(0, 'Archive response did not include an image.', 'invalid_archive_response');
	}

	return response.image;
};

export const unarchiveImageById = async (input: ArchiveImageInput): Promise<PhotogramImage> => {
	assertImageId(input.imageId, 'unarchive');
	assertIdToken(input.idToken);

	const response = await requestJson<{ image?: PhotogramImage }>(
		buildApiUrl(`/images/${encodeURIComponent(input.imageId)}/unarchive`),
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${input.idToken}`,
			},
		},
	);

	if (!response.image) {
		throw new ApiError(0, 'Unarchive response did not include an image.', 'invalid_unarchive_response');
	}

	return response.image;
};

const getAuthToken = async (): Promise<string> => {
	const user = auth.currentUser;

	if (!user) {
		throw new Error('User must be authenticated to perform this action.');
	}

	return user.getIdToken();
};

const mapSnapshotToImages = (snapshot: firebase.firestore.QuerySnapshot): ImageInterface[] =>
	snapshot.docs.map(doc => {
		const data = doc.data();
		const uploadDateRaw = data.imgUploadDate as unknown;
		const asTimestampLike = uploadDateRaw as FirestoreTimestampLike;
		const imgUploadDate =
			typeof uploadDateRaw === 'number'
				? uploadDateRaw
				: uploadDateRaw && typeof asTimestampLike.toMillis === 'function'
					? asTimestampLike.toMillis()
					: 0;

		return {
			imgId: doc.id,
			imgArchived: Boolean(data.imgArchived),
			imgDescription: data.imgDescription ?? '',
			imgLikes: Number(data.imgLikes ?? 0),
			imgName: data.imgName ?? '',
			imgPrivate: Boolean(data.imgPrivate),
			imgSrc: data.imgSrc ?? '',
			imgUploadDate,
			imgUserOwner: data.imgUserOwner ?? '',
		};
	});

const sortNewestFirst = (images: ImageInterface[]) =>
	[...images].sort((a, b) => (b.imgUploadDate ?? 0) - (a.imgUploadDate ?? 0));

// Get only public, non-archived images ordered by upload date (newest first)
export const getPublicImages = async (): Promise<ImageInterface[]> => {
	const snapshot = await imagesRef
		.where('imgArchived', '==', false)
		.where('imgPrivate', '==', false)
		.get();

	return sortNewestFirst(mapSnapshotToImages(snapshot));
};

// Get images for a specific user; optionally include archived ones
export const getUserImages = async (uid: string, includeArchived?: boolean): Promise<ImageInterface[]> => {
	let query: firebase.firestore.Query = imagesRef.where('imgUserOwner', '==', uid);

	if (!includeArchived) {
		query = query.where('imgArchived', '==', false);
	}

	const snapshot = await query.get();
	return sortNewestFirst(mapSnapshotToImages(snapshot));
};

// Function to set image privacy (private/public)
export const setImagePrivacy = async (image: ImageInterface, isCurrentlyPrivate: boolean) => {
	const imageDocRef = db.collection(imagesDbCollection).doc(image.imgId);
	await imageDocRef.update({ imgPrivate: !isCurrentlyPrivate });
};

// Function to archive/unarchive an image
export const archiveImage = async (image: ImageInterface, imgArchived: boolean) => {
	const imageDocRef = db.collection(imagesDbCollection).doc(image.imgId);
	await imageDocRef.update({ imgArchived: !imgArchived });
};

const uploadLegacyImage = async (
	image: File,
	options?: LegacyUploadOptions,
): Promise<string | null> => {
	const formData = new FormData();
	formData.append('image', image);
	const authToken = await getAuthToken();

	try {
		options?.onStage?.('uploading');

		const result = await new Promise<UploadApiResponse>((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open('POST', `${config.apiBaseUrl}/resize-upload`);
			xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);

			xhr.upload.onprogress = (event: ProgressEvent) => {
				if (!event.lengthComputable) return;
				const percent = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)));
				options?.onProgress?.(percent);
				options?.onStage?.(percent >= 100 ? 'processing' : 'uploading');
			};

			xhr.upload.onloadend = () => {
				options?.onProgress?.(100);
				options?.onStage?.('processing');
			};

			xhr.onerror = () => reject(new Error('Network error while uploading image.'));
			xhr.onabort = () => reject(new Error('Upload canceled.'));

			xhr.onload = () => {
				const isOk = xhr.status >= 200 && xhr.status < 300;
				if (!isOk) {
					reject(new Error(xhr.responseText || `Upload failed (HTTP ${xhr.status}).`));
					return;
				}

				try {
					const parsed = JSON.parse(xhr.responseText) as unknown;
					if (parsed && typeof parsed === 'object') {
						resolve(parsed as UploadApiResponse);
						return;
					}
					reject(new Error('Invalid upload response payload.'));
				} catch {
					reject(new Error('Invalid JSON response from upload endpoint.'));
				}
			};

			xhr.send(formData);
		});

		logger.debug('Upload response:', result);
		return result?.url ?? null;
	} catch (error) {
		logger.error('Error uploading image:', error);
		return null;
	}
};

export function uploadImage(input: UploadImageInput): Promise<PhotogramImage>;
export function uploadImage(image: File, options?: LegacyUploadOptions): Promise<string | null>;
export function uploadImage(input: UploadImageInput | File, options?: LegacyUploadOptions): Promise<PhotogramImage | string | null> {
	if ('file' in input && 'idToken' in input) {
		return uploadPhotogramImage(input);
	}

	return uploadLegacyImage(input, options);
}

const deleteLegacyImage = async (image: ImageInterface) => {
	if (!image.imgName) {
		throw new Error('Missing image name. Cannot delete storage object.');
	}

	const authToken = await getAuthToken();

	// 1) Delete storage object via backend first to avoid storage orphans.
	const storageResponse = await fetch(`${config.apiBaseUrl}/delete-image`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authToken}`,
		},
		body: JSON.stringify({ imgName: image.imgName }),
	});

	if (!storageResponse.ok) {
		const reason = await storageResponse.text();
		throw new Error(reason || `Storage delete failed (HTTP ${storageResponse.status}).`);
	}

	logger.debug('Image deleted from Firebase Storage:', image.imgName);

	if (!image.imgId) {
		throw new Error('Storage deleted but Firestore document id is missing. Manual cleanup required.');
	}

	// 2) Delete Firestore metadata after storage delete succeeds.
	const imageDocRef = db.collection(imagesDbCollection).doc(image.imgId);
	try {
		await imageDocRef.delete();
		logger.debug('Firestore document deleted:', image.imgId);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Storage deleted but Firestore delete failed: ${message}`);
	}
};

export function deleteImage(input: DeleteImageInput): Promise<DeleteImageResult>;
export function deleteImage(image: ImageInterface): Promise<void>;
export function deleteImage(input: DeleteImageInput | ImageInterface): Promise<DeleteImageResult | void> {
	if ('imageId' in input && 'idToken' in input) {
		return deletePhotogramImage(input);
	}

	return deleteLegacyImage(input);
}
