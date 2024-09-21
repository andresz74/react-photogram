import { db, imagesDbCollection } from 'firebase.configuration'; // Removed `storage` as uploads are handled on the backend
import { ImageInterface } from 'type';

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
			imgUploadDate: doc.data().imgUploadDate,
			imgSrc: doc.data().imgSrc,
			imgName: doc.data().imgName,
			imgUserOwner: doc.data().imgUserOwner,
		});
	});

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
		const response = await fetch('http://192.168.1.179:3003/api/upload', {
			method: 'POST',
			body: formData,
		});

		if (response.ok) {
			const { url } = await response.json();
			return url; // Return the uploaded image URL
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
		const response = await fetch(`http://192.168.1.179:3003/api/delete-image`, {
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
