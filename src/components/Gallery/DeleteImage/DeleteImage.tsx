import React from 'react';
import { db, imagesDbCollection, storage } from 'firebase.configuration';
import { ImageInterface } from 'type';
import './DeleteImage.css';

export interface ComponentProps {
	imgData: ImageInterface;
}

export const handleDeleteImage = (data: ImageInterface) => {
	const imageDocRef = db.collection(imagesDbCollection).doc(data.imgId);
	const imageStorageRef = storage.ref(`images/${data.imgName}`);
	imageDocRef
		.delete()
		.then(() => {
			console.log('Document successfully deleted!', data.imgId);
		})
		.catch(err => {
			console.error('Error removing document: ', err);
		});

	imageStorageRef
		.delete()
		.then(() => {
			console.log('File successfully deleted!', data.imgName);
		})
		.catch(err => {
			console.error('an error occurred!: ', err);
		});
};

export const DeleteImage: React.FC<ComponentProps> = ({ imgData }) => {
	return (
		<div
			className="deleteIconWrapper"
			onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => handleDeleteImage(imgData)}
		>
			<i className="icofont-bin" title="Delete Image"></i>
		</div>
	);
};

DeleteImage.displayName = 'DeleteImage';
