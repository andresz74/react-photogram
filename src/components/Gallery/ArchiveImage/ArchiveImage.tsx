import React from 'react';
import { db, imagesDbCollection } from 'firebase.configuration';
import { ImageInterface } from 'type';
import './ArchiveImage.css';

export interface ComponentProps {
	imgData: ImageInterface;
}

export const handleArchiveImage = (data: ImageInterface) => {
	const imageDocRef = db.collection(imagesDbCollection).doc(data.imgId);
	imageDocRef.update({ imgArchived: true });
};

export const ArchiveImage: React.FC<ComponentProps> = ({ imgData }) => {
	return (
		<div
			className="archiveIconWrapper"
			onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => handleArchiveImage(imgData)}
		>
			<i className="icofont-inbox" title="Archive Image"></i>
		</div>
	);
};

ArchiveImage.displayName = 'ArchiveImage';
