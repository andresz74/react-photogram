import React from 'react';
import Modal from 'react-modal';
import './ModalImage.css';

export interface ComponentProps {
	imgAlt: string;
	imgSrc: string;
	isOpen: boolean;
}

export const ModalImage: React.FC<ComponentProps> = ({ imgAlt, imgSrc, isOpen }) => {
	return (
		<Modal className="photoModal" overlayClassName="photoModalOverlay" isOpen={isOpen} ariaHideApp={false}>
            <div className="photoModalWrap">
			    <img src={imgSrc} alt={imgAlt} />
            </div>
		</Modal>
	);
};

ModalImage.displayName = "ModalImage";