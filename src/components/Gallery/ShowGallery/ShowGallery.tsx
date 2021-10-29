import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ArchiveImage, AuthContext, ModalImage, OverlayLayer } from 'components';
import { actionCreators } from 'state';
import { RootState } from 'state/reducers';
import { ImageInterface } from 'type';
import './ShowGallery.css';

const ShowGalleryInternal: React.FC = () => {
	const user = React.useContext(AuthContext);
	const [modalIsOpen, setModalIsOpen] = React.useState<boolean>(false);
	const [modalImage, setModalImage] = React.useState<ImageInterface | null>(null);
	const [imagesList, setImagesList] = React.useState<ImageInterface[]>([]);
	
	// To hide archived images
	const [showArchivedImages, setShowArchivedImages] = React.useState<boolean>(false);

	const openModal = (imageItem: ImageInterface) => {
		setModalImage(imageItem);
		setModalIsOpen(true);
	};

	const closeModal = () => setModalIsOpen(false);

	// Manage the images of the album
	const handledImageList = (list: ImageInterface[], showArchived: boolean) => {
		!showArchived ? setImagesList(list) : setImagesList(list.filter(item => item.imgArchived !== true));
	};

	const imagesData = useSelector((state: RootState) => state.images);
	const dispatch = useDispatch();
	const { loadImages } = bindActionCreators(actionCreators, dispatch);

	React.useEffect(() => {
		try {
			loadImages();
			handledImageList(imagesData, showArchivedImages);
		} catch (error) {
			console.log(error);
		}
	}, [showArchivedImages]);

	return (
		<div className="albumWrap">
			{/* <div className="albumHeader">
				<span
					style={{ display: 'inline-block' }}
					onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => setShowArchivedImages(true)}
				>
					Show Archived
				</span>
			</div> */}
			<div className="albumRow">
				{imagesList.map((imageItem: ImageInterface, index: number) => {
					return (
						!imageItem.imgArchived && (
							<div className="photoWrap" key={index}>
								<OverlayLayer>
									{user && <ArchiveImage imgData={imageItem} />}
									<div className="photoActionLayer" onClick={() => openModal(imageItem)}></div>
								</OverlayLayer>
								<img src={imageItem.imgSrc} alt={imageItem.imgName} />
							</div>
						)
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
