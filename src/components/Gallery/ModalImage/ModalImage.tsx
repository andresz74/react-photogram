import React from 'react';
import { CoreModal } from 'components';
import './ModalImage.css';

export interface ComponentProps {
	imgDescription: string;
	imgLikes: number;
	imgName: string;
	imgSrc: string;
	isOpen: boolean;
	onClose: () => void;
}

export const ModalImage: React.FC<ComponentProps> = ({ imgDescription, imgLikes, imgName, imgSrc, isOpen, onClose }) => {
	const [isPortrait, setIsPortrait] = React.useState(false);
	const [imgStyle, setImgStyle] = React.useState<React.CSSProperties>({});
	const [imgBoxStyle, setImgBoxStyle] = React.useState<React.CSSProperties>({});

	const elementRef = React.useRef<HTMLDivElement>(null);
	// const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

	React.useEffect(() => {
		const img = new Image();
		img.src = imgSrc;
	
		const calculateImageDimensions = () => {
			// Image's natural dimensions
			const { naturalWidth, naturalHeight } = img;
	
			// Calculate the aspect ratio of the image
			const imageAspectRatio = naturalWidth / naturalHeight;
	
			// Viewport constraints
			const maxWidth = window.innerWidth * 0.8; // 80vw
			const maxHeight = window.innerHeight * 0.8; // 80vh
	
			// Final dimensions based on constraints
			let finalWidth, finalHeight;
	
			if (imageAspectRatio > 1) {
				// Landscape image: Width constrained by maxWidth
				finalWidth = Math.min(maxWidth, naturalWidth);
				finalHeight = finalWidth / imageAspectRatio;
	
				// If height exceeds maxHeight, adjust dimensions
				if (finalHeight > maxHeight) {
					finalHeight = maxHeight;
					finalWidth = finalHeight * imageAspectRatio;
				}
			} else {
				// Portrait image: Height constrained by maxHeight
				finalHeight = Math.min(maxHeight, naturalHeight);
				finalWidth = finalHeight * imageAspectRatio;
	
				// If width exceeds maxWidth, adjust dimensions
				if (finalWidth > maxWidth) {
					finalWidth = maxWidth;
					finalHeight = finalWidth / imageAspectRatio;
				}
			}
	
			// Apply consistent styles
			setImgStyle({
				width: `${finalWidth}px`,
				height: `${finalHeight}px`,
			});
		};
	
		// Wait for the image to load and then calculate dimensions
		img.onload = calculateImageDimensions;
	
		// Recalculate on window resize
		window.addEventListener('resize', calculateImageDimensions);
	
		// Cleanup event listener on unmount
		return () => {
			window.removeEventListener('resize', calculateImageDimensions);
		};
	}, [imgSrc]); // Recalculate only when the image source changes
	
	


	// const imgTitle = <div className="modalTitle">{imgName && <span>{imgName}</span>}</div>
	const handleOnLike = React.useCallback((event: React.MouseEvent): void => {
		console.log('I like it');
	}, []);
	return (
		<CoreModal isOpen={isOpen} onRequestClose={onClose}>
			<div className={`photoModalWrap`}>
				<div className='imageBox' ref={elementRef} style={imgBoxStyle}>
					<img src={imgSrc} alt={imgName} style={imgStyle} />
				</div>
				<div className='infoBox'>
					{imgDescription && <div className='imgDescription'>{imgDescription}</div>}
					<div className='socialWrap'>
						<span className={`socialIco multiLike`}>
							<span className='multiLikeIcon'>
								<i className={`icofont-heart iconLike ${imgLikes && 'likesActive'}`} onClick={handleOnLike}></i>
							</span>
							<span className='multiLikeCount'>{imgLikes}</span>
						</span>
						{/* <span className='socialIco'>Comment</span>
						<span className='socialIco'>Share</span>
						<span className='socialIco'>Favorite</span> */}
					</div>
				</div>
			</div>
		</CoreModal>
	);
};

ModalImage.displayName = 'ModalImage';
