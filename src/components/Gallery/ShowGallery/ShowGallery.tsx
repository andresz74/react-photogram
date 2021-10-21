import React from 'react';

import { db, imagesDbCollection } from 'firebase.configuration';
import './ShowGallery.css';

export interface PhotogramInterface {
	imagesArray: ImageInterface[];
}

export interface ImageInterface {
	imgSrc: string;
	imgName: string;
}

const imagesRef = db.collection(imagesDbCollection);

const getImageList = async () => {
	const snapshot = await imagesRef.get();
	const data: ImageInterface[] = [];
	snapshot.forEach(doc => {
		data.push({
			imgSrc: doc.data().imgSrc,
			imgName: doc.data().imgName,
		});
	});
	return data;
};

export const ShowGallery: React.FC = () => {
	const [imagesList, setImagesList] = React.useState<ImageInterface[]>([]);

	React.useEffect(() => {
		getImageList().then(results => setImagesList(results));
	}, []);

	return (
		<div className="App-album">
			<div className="App-album-row">
				{imagesList.map((imageItem: ImageInterface, index: number) => {
					return (
						<div className="App-album-photo" key={index}>
							<img src={imageItem.imgSrc} alt={imageItem.imgName} />
						</div>
					);
				})}
			</div>
		</div>
	);
};

ShowGallery.displayName = 'ShowGallery';
