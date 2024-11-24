import React from 'react';
import { CoreModal } from 'components';
import './ModalImage.css';

export interface ComponentProps {
	imgDescription: string;
	imgName: string;
	imgSrc: string;
	isOpen: boolean;
	onClose: () => void;
}

export const ModalImage: React.FC<ComponentProps> = ({ imgDescription, imgName, imgSrc, isOpen, onClose }) => {
	const [isPortrait, setIsPortrait] = React.useState(false);
	const [imgStyle, setImgStyle] = React.useState<React.CSSProperties>({});

	const elementRef = React.useRef<HTMLDivElement>(null);
	const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

	React.useEffect(() => {
		const img = new Image();
		img.src = imgSrc;
		img.onload = () => {
			setIsPortrait(img.naturalHeight > img.naturalWidth);

			const { naturalWidth, naturalHeight } = img;

			// Calculate the appropriate width and maxHeight value
			const aspectRatio = isPortrait ? naturalWidth / naturalHeight : naturalHeight / naturalWidth;

			if (elementRef.current) {
				const { width, height } = elementRef.current.getBoundingClientRect();
				setDimensions({ width, height });
				const imageStyles: React.CSSProperties = isPortrait ?
					{
						maxHeight: `90vh`,
					} :
					{
						height: `${dimensions.width * aspectRatio}px`,
					}

				setImgStyle(imageStyles);
			}
		};
	}, [dimensions.width, imgSrc, isPortrait]);

	// const imgTitle = <div className="modalTitle">{imgName && <span>{imgName}</span>}</div>

	return (
		<CoreModal isOpen={isOpen} onRequestClose={onClose}>
			<div className={`photoModalWrap portrait`}>
				<div className='imageBox' ref={elementRef}>
					<img src={imgSrc} alt={imgName} style={imgStyle} />
				</div>
				{imgDescription && <div className={`descriptionBox descriptionStyle ${isPortrait ? 'dbRight' : 'dbBottom'}`}>
					<div className='imgDescription'>{imgDescription}</div>
				</div>}
			</div>
		</CoreModal>
	);
};

ModalImage.displayName = 'ModalImage';
