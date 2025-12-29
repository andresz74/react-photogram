import firebase from 'firebase/app';
import { auth, db, imagesDbCollection } from 'firebase.configuration';
import { ImageInterface } from 'type';
import config from '../config';

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
	snapshot.docs.map(doc => ({
		imgId: doc.id,
		imgArchived: doc.data().imgArchived,
		imgDescription: doc.data().imgDescription,
		imgLikes: doc.data().imgLikes,
		imgName: doc.data().imgName,
		imgPrivate: doc.data().imgPrivate,
		imgSrc: doc.data().imgSrc,
		imgUploadDate: doc.data().imgUploadDate,
		imgUserOwner: doc.data().imgUserOwner,
	}));

// Get only public, non-archived images ordered by upload date (newest first)
export const getPublicImages = async (): Promise<ImageInterface[]> => {
	const snapshot = await imagesRef
		.where('imgArchived', '==', false)
		.where('imgPrivate', '==', false)
		.orderBy('imgUploadDate', 'desc')
		.get();

	return mapSnapshotToImages(snapshot);
};

// Get images for a specific user; optionally include archived ones
export const getUserImages = async (uid: string, includeArchived?: boolean): Promise<ImageInterface[]> => {
	let query: firebase.firestore.Query = imagesRef.where('imgUserOwner', '==', uid);

	if (!includeArchived) {
		query = query.where('imgArchived', '==', false);
	}

	const snapshot = await query.orderBy('imgUploadDate', 'desc').get();
	return mapSnapshotToImages(snapshot);
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
export const uploadImage = async (image: File): Promise<string | null> => {
	const formData = new FormData();
	formData.append('image', image);
	const authToken = await getAuthToken();

	try {
		// Make a POST request to the backend for image upload
		const response = await fetch(`${config.apiBaseUrl}/resize-upload`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${authToken}`,
			},
			body: formData,
		});

		const result = await response.json();
		console.log('Upload response:', result);

		if (response.ok) {
			return result.url; // Return the uploaded image URL
		} else {
			console.error('Error uploading image:', await response.text());
			return null;
		}
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
		console.log(`Firestore document deleted: ${image.imgId}`);

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
			console.log(`Image successfully deleted from Firebase Storage: ${image.imgName}`);
		} else {
			console.error('Error deleting image from Firebase Storage:', await response.text());
		}
	} catch (error) {
		console.error('Error deleting image:', error);
	}
};
