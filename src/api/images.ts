import { db, imagesDbCollection } from 'firebase.configuration';
import { ImageInterface } from 'type';
import config from '../config';

// Firestore reference
const imagesRef = db.collection(imagesDbCollection);

// Function to get the list of images from Firestore
export const getImageList = async (): Promise<ImageInterface[]> => {
	const snapshot = await imagesRef.get();
	const data: ImageInterface[] = [];

	snapshot.forEach(doc => {
		data.push({
			imgId: doc.id,
			imgArchived: doc.data().imgArchived,
			imgDescription: doc.data().imgDescription,
			imgName: doc.data().imgName,
			imgPrivate: doc.data().imgPrivate,
			imgSrc: doc.data().imgSrc,
			imgUploadDate: doc.data().imgUploadDate,
			imgUserOwner: doc.data().imgUserOwner,
		});
	});
	console.log(data);

	return data;
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

	try {
		// Make a POST request to the backend for image upload
		const response = await fetch(`${config.apiBaseUrl}/resize-upload`, {
			method: 'POST',
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
	try {
		await imageDocRef.delete();
		console.log(`Firestore document deleted: ${image.imgId}`);

		// Call the backend API to delete the image from Firebase Storage
		const response = await fetch(`${config.apiBaseUrl}/delete-image`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
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
