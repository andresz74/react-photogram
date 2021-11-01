import React from 'react';
// import { useDispatch } from 'react-redux';

import { ImageInterface } from 'type';
// import { actionCreators } from 'state';
import './ArchiveImage.css';

export interface ComponentProps {
	imgData: ImageInterface;
	handleArchiveImage: (item: ImageInterface) => void;
}

export const ArchiveImage: React.FC<ComponentProps> = ({ imgData, handleArchiveImage }) => {
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
