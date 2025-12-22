import React from 'react';
import { ImageInterface } from 'type';
import './HideImage.css';

export interface ComponentProps {
	imgData: ImageInterface;
	imgPrivate: boolean;
	handleHideImage: (item: ImageInterface, imgArchived: boolean) => void;
}

export const HideImage: React.FC<ComponentProps> = ({ imgPrivate, imgData, handleHideImage }) => {
	const label = imgPrivate ? 'Make image public' : 'Make image private';

	return (
		<button
			type="button"
			className="hideIconWrapper"
			aria-label={label}
			onClick={() => handleHideImage(imgData, imgPrivate)}
		>
			{!imgPrivate ? (
				<i className="icofont-eye-blocked" title={label} aria-hidden="true"></i>
			) : (
				<i className="icofont-eye" title={label} aria-hidden="true"></i>
			)}
		</button>
	);
};

HideImage.displayName = 'HideImage';
