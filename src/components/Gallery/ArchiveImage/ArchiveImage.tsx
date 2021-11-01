import React from 'react';
import { ImageInterface } from 'type';
import './ArchiveImage.css';

export interface ComponentProps {
	imgData: ImageInterface;
	imgArchived: boolean;
	handleArchiveImage: (item: ImageInterface, imgArchived: boolean) => void;
}

export const ArchiveImage: React.FC<ComponentProps> = ({ imgArchived, imgData, handleArchiveImage }) => {
	return (
		<div
			className="archiveIconWrapper"
			onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => handleArchiveImage(imgData, imgArchived)}
		>
			{!imgArchived ? (
				<i className="icofont-inbox" title="Archive Image"></i>
			) : (
				<i className="icofont-upload-alt" title="Archive Image"></i>
			)}
		</div>
	);
};

ArchiveImage.displayName = 'ArchiveImage';
