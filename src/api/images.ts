import { db, imagesDbCollection } from 'firebase.configuration';
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
	
}