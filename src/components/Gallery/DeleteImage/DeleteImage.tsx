import React from 'react';
import { ImageInterface } from 'type';
import { logger } from 'utils/logger';
import './DeleteImage.css';

export interface ComponentProps {
	imgData: ImageInterface;
	isDeleting?: boolean;
	onDelete: (item: ImageInterface) => Promise<void>;
}

export const DeleteImage: React.FC<ComponentProps> = ({ imgData, isDeleting, onDelete }) => {
	const label = isDeleting ? 'Deleting image' : 'Delete image';

	return (
		<button
			type="button"
			className="deleteIconWrapper"
			aria-label={label}
			title={label}
			disabled={isDeleting}
			onClick={(event) => {
				event.stopPropagation();
				onDelete(imgData).catch((error) => logger.error('Error deleting image:', error));
			}}
		>
			<i className="icofont-bin" aria-hidden="true"></i>
		</button>
	);
};

DeleteImage.displayName = 'DeleteImage';
