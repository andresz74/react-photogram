import React from 'react';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/storage';
import { firebaseConfig, imagesDbCollection } from 'firebase.configuration';
import './ShowGallery.css';

export interface PhotogramInterface {
	imagesArray: ImageInterface[];
}

export interface ImageInterface {
	imgSrc: string;
	imgName: string;
}

// Initialize Firebase if it hasn't been initialize by other component
let app;
if (!firebase.apps.length) {
	app = firebase.initializeApp(firebaseConfig);
}

// Initialize Firebase Storage
const db = firebase.firestore(app);
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
							<img src={imageItem.imgSrc} alt={imageItem.imgSrc} />
						</div>
					);
				})}
			</div>
		</div>
	);
};

ShowGallery.displayName = 'ShowGallery';
