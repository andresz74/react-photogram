import { db, imagesDbCollection, storage } from 'firebase.configuration';
import { ImageInterface } from 'type';

const imagesRef = db.collection(imagesDbCollection);

export const getImageList = async () => {
	const snapshot = await imagesRef.get();
	const data: ImageInterface[] = [];
	
	snapshot.forEach(doc => {
		data.push({
			imgId: doc.id,
			imgArchived: doc.data().imgArchived,
			imgUploadDate: doc.data().imgUploadDate,
			imgSrc: doc.data().imgSrc,
			imgName: doc.data().imgName,
		});
	});

	return data;
};

export const archiveImage = async (image: ImageInterface, imgArchived: boolean) => {
	const imageDocRef = db.collection(imagesDbCollection).doc(image.imgId);
	imageDocRef.update({ imgArchived: !imgArchived });
};

// export const uploadImage = async (imgName: string, imgFile: File) => {
// 	const uploadTask = storage.ref(`images/${imgName}`).put(imgFile);

// 	uploadTask.on(
// 		'state_changed',
// 		snapshot => {
// 			const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
// 			setImageUploadProgress(progress);
// 		},
// 		error => {
// 			console.error(error);
// 		},
// 		() => {
// 			storage
// 				.ref('images')
// 				.child(image.name)
// 				.getDownloadURL()
// 				.then(url => {
// 					setImageUrl(url);
// 					db.collection(imagesDbCollection).add({
// 						imgArchived: false,
// 						imgSrc: url,
// 						imgName: image.name,
// 						imgUploadDate: Date.now(),
// 					});
// 				})
// 				.catch(error => {
// 					console.error(error);
// 				});
// 		},
// 	);
// };
