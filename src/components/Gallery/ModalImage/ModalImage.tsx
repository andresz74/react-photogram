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
	const [isLoaded, setIsLoaded] = React.useState(false);
	const [hasError, setHasError] = React.useState(false);
	const [isZoomed, setIsZoomed] = React.useState(false);

	React.useEffect(() => {
		if (!isOpen) return;
		setIsLoaded(false);
		setHasError(false);
		setIsZoomed(false);
	}, [imgSrc, isOpen]);

	// const imgTitle = <div className="modalTitle">{imgName && <span>{imgName}</span>}</div>
	const handleOnLike = React.useCallback((): void => {}, []);

	const handleToggleZoom = React.useCallback(() => {
		if (!isLoaded || hasError) return;
		setIsZoomed(previous => !previous);
	}, [hasError, isLoaded]);

	return (
		<CoreModal
			isOpen={isOpen}
			onRequestClose={onClose}
			className="modalImageCore"
			bodyOpenClassName="modalImageOpen"
			htmlOpenClassName="modalImageOpen"
		>
			<div className={`photoModalWrap`}>
				<div className={`imageBox ${isZoomed ? 'imageBoxZoomed' : ''}`}>
					{!isLoaded && !hasError && <div className="imageStatus">Loading…</div>}
					{hasError && (
						<div className="imageStatus">
							<div>Couldn’t load image.</div>
							<a className="imageFallbackLink" href={imgSrc} target="_blank" rel="noreferrer">
								Open original
							</a>
						</div>
					)}
					<img
						src={imgSrc}
						alt={imgName}
						className={`modalImage ${isLoaded ? 'modalImageLoaded' : ''} ${isZoomed ? 'modalImageZoomed' : ''}`}
						decoding="async"
						draggable={false}
						onLoad={() => setIsLoaded(true)}
						onError={() => setHasError(true)}
						onClick={handleToggleZoom}
						/>
					</div>
					<div className='infoBox'>
						<div className='imgDescription'>{imgDescription || null}</div>
						<div className='socialWrap'>
							<span className={`socialIco multiLike`}>
								<span className='multiLikeIcon'>
									<button
										type="button"
										className="likeButton"
										aria-label="Like image"
										onClick={handleOnLike}
									>
										<i
											className={`icofont-heart iconLike ${imgLikes ? 'likesActive' : ''}`}
											aria-hidden="true"
										/>
									</button>
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
