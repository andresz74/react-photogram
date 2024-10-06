import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ArchiveImage, AuthContext, HideImage, ModalImage, OverlayLayer } from 'components';
import { actionCreators } from 'state';
import { RootState } from 'state/reducers';
import { ImageInterface } from 'type';
import './ShowGallery.css';

const ShowGalleryInternal: React.FC = () => {
	const user = React.useContext(AuthContext);
	const [modalIsOpen, setModalIsOpen] = React.useState<boolean>(false);
	const [modalImage, setModalImage] = React.useState<ImageInterface | null>(null);

	const openModal = (imageItem: ImageInterface) => {
		setModalImage(imageItem);
		setModalIsOpen(true);
	};

	const closeModal = () => setModalIsOpen(false);

	const imagesData: ImageInterface[] = useSelector((state: RootState) => state.images);
	const dispatch = useDispatch();

	React.useEffect(() => {
		try {
			dispatch(actionCreators.loadImages());
		} catch (error) {
			console.error(error);
		}
	}, [dispatch]);

	const handleArchiveImage = (data: ImageInterface, archived: boolean) => {
		try {
			dispatch(actionCreators.archiveImage(data, archived));
			dispatch(actionCreators.loadImages());
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<div className="albumWrap">
			<div className="albumRow">
				{imagesData.length === 0 ? (
					<p>No images available</p>  // Placeholder to show when no images are loaded
				) : (
					imagesData.map((imageItem: ImageInterface, index: number) => {
						return (
							<div className="photoWrap" key={index}>
								<OverlayLayer>
									<div className="photoActionLayer" onClick={() => openModal(imageItem)}></div>
								</OverlayLayer>
								<img src={imageItem.imgSrc} alt={imageItem.imgName} />
							</div>
						);
					})
				)}
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
