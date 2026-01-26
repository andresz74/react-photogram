import React from 'react';
import { ImageInterface } from 'type';
import './ArchiveImage.css';

export interface ComponentProps {
	imgData: ImageInterface;
	imgArchived: boolean;
	handleArchiveImage: (item: ImageInterface, imgArchived: boolean) => void;
}

export const ArchiveImage: React.FC<ComponentProps> = ({ imgArchived, imgData, handleArchiveImage }) => {
	const label = imgArchived ? 'Unarchive image' : 'Archive image';

	return (
		<button
			type="button"
			className="archiveIconWrapper"
			aria-label={label}
			onClick={() => handleArchiveImage(imgData, imgArchived)}
		>
			{!imgArchived ? (
				<i className="icofont-inbox" title={label} aria-hidden="true"></i>
			) : (
				<i className="icofont-upload-alt" title={label} aria-hidden="true"></i>
			)}
		</button>
	);
};

ArchiveImage.displayName = 'ArchiveImage';
