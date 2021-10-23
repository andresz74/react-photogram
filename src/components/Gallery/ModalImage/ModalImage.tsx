import React from 'react';
import { CoreModal } from 'components';
import './ModalImage.css';
import { title } from 'process';

export interface ComponentProps {
	imgName: string;
	imgSrc: string;
	isOpen: boolean;
	onClose: () => void;
}

export const ModalImage: React.FC<ComponentProps> = ({ imgName, imgSrc, isOpen, onClose }) => {
	return (
		<CoreModal isOpen={isOpen} onRequestClose={onClose}>
			<div className="photoModalWrap">
				<img src={imgSrc} alt={imgName} />
			</div>
		</CoreModal>
	);
};

ModalImage.displayName = 'ModalImage';
