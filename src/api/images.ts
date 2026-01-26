import firebase from 'firebase/app';
import { auth, db, imagesDbCollection } from 'firebase.configuration';
import { ImageInterface } from 'type';
import config from '../config';
import { logger } from 'utils/logger';

// Firestore reference
const imagesRef = db.collection(imagesDbCollection);

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
		const imgUploadDate =
			typeof uploadDateRaw === 'number'
				? uploadDateRaw
				: uploadDateRaw && typeof (uploadDateRaw as any).toMillis === 'function'
					? (uploadDateRaw as any).toMillis()
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

// Function to upload an image to the backend service
export const uploadImage = async (
	image: File,
	options?: {
		onProgress?: (percent: number) => void;
		onStage?: (stage: 'uploading' | 'processing') => void;
	},
): Promise<string | null> => {
	const formData = new FormData();
	formData.append('image', image);
	const authToken = await getAuthToken();

	try {
		options?.onStage?.('uploading');

		const result = await new Promise<any>((resolve, reject) => {
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
					resolve(JSON.parse(xhr.responseText));
				} catch {
					reject(new Error('Invalid JSON response from upload endpoint.'));
				}
			};

			xhr.send(formData);
		});

		logger.debug('Upload response:', result);
		return result?.url ?? null;
	} catch (error) {
		console.error('Error uploading image:', error);
		return null;
	}
};

// Function to delete an image both from Firestore and Firebase Storage via backend
export const deleteImage = async (image: ImageInterface) => {
	// Delete image document from Firestore
	const imageDocRef = db.collection(imagesDbCollection).doc(image.imgId);
	const authToken = await getAuthToken();

	try {
		await imageDocRef.delete();
		logger.debug('Firestore document deleted:', image.imgId);

		// Call the backend API to delete the image from Firebase Storage
		const response = await fetch(`${config.apiBaseUrl}/delete-image`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${authToken}`,
			},
			body: JSON.stringify({ imgName: image.imgName }),
		});

		if (response.ok) {
			logger.debug('Image deleted from Firebase Storage:', image.imgName);
		} else {
			console.error('Error deleting image from Firebase Storage:', await response.text());
		}
	} catch (error) {
		console.error('Error deleting image:', error);
	}
};
