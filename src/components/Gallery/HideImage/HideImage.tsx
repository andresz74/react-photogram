import React from 'react';
import { ImageInterface } from 'type';
import './HideImage.css';

export interface ComponentProps {
	imgData: ImageInterface;
	imgPrivate: boolean;
	handleHideImage: (item: ImageInterface, imgArchived: boolean) => void;
}

export const HideImage: React.FC<ComponentProps> = ({ imgPrivate, imgData, handleHideImage }) => {
	return (
		<div
			className="hideIconWrapper"
			onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => handleHideImage(imgData, imgPrivate)}
		>
			{!imgPrivate ? (
				<i className="icofont-eye-blocked" title="Hide Image"></i>
			) : (
				<i className="icofont-eye" title="Show Image"></i>
			)}
		</div>
	);
};

HideImage.displayName = 'HideImage';
