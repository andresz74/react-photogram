import React from 'react';
import { ImageInterface } from 'type';
import { deleteImage } from 'api';
import { logger } from 'utils/logger';
import './DeleteImage.css';

export interface ComponentProps {
	imgData: ImageInterface;
}

// Call the API management deleteImage function to handle image deletion
export const handleDeleteImage = async (data: ImageInterface) => {
	try {
		await deleteImage(data);
		logger.debug('Image deleted successfully', data.imgId);
	} catch (error) {
		console.error('Error deleting image:', error);
	}
};

export const DeleteImage: React.FC<ComponentProps> = ({ imgData }) => {
	return (
		<div
			className="deleteIconWrapper"
			onClick={() => handleDeleteImage(imgData)}
		>
			<i className="icofont-bin" title="Delete Image"></i>
		</div>
	);
};

DeleteImage.displayName = 'DeleteImage';
