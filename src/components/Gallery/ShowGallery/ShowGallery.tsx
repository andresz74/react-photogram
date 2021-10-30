import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ArchiveImage, AuthContext, ModalImage, OverlayLayer } from 'components';
import { actionCreators } from 'state';
import { RootState } from 'state/reducers';
import { ImageInterface } from 'type';
import './ShowGallery.css';

const ShowGalleryInternal: React.FC = () => {
	const user = React.useContext(AuthContext);
	const [modalIsOpen, setModalIsOpen] = React.useState<boolean>(false);
	const [modalImage, setModalImage] = React.useState<ImageInterface | null>(null);

	// To hide archived images
	const [showArchivedImages, setShowArchivedImages] = React.useState<boolean>(false);

	const openModal = (imageItem: ImageInterface) => {
		setModalImage(imageItem);
		setModalIsOpen(true);
	};

	const closeModal = () => setModalIsOpen(false);

	const imagesData: ImageInterface[]= useSelector((state: RootState) => state.images);
	const dispatch = useDispatch();

	React.useEffect(() => {
		try {
			dispatch(actionCreators.loadImages(showArchivedImages));
		} catch (error) {
			console.log(error);
		}
	}, [dispatch, showArchivedImages]);

	return (
		<div className="albumWrap">
			<div className="albumHeader">
				<span
					style={{ display: 'inline-block' }}
					onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => setShowArchivedImages(!showArchivedImages)}
				>
					Show Archived
				</span>
			</div>
			<div className="albumRow">
				{imagesData.map((imageItem: ImageInterface, index: number) => {
					return (
						<div className="photoWrap" key={index}>
							<OverlayLayer>
								{user && <ArchiveImage imgData={imageItem} />}
								<div className="photoActionLayer" onClick={() => openModal(imageItem)}></div>
							</OverlayLayer>
							<img src={imageItem.imgSrc} alt={imageItem.imgName} />
						</div>
					);
				})}
			</div>
			{modalImage !== null && (
				<ModalImage imgSrc={modalImage.imgSrc} imgName={modalImage.imgName} isOpen={modalIsOpen} onClose={closeModal} />
			)}
		</div>
	);
};

const ShowGallery = React.memo(ShowGalleryInternal);
ShowGallery.displayName = 'ShowGallery';
export { ShowGallery };
