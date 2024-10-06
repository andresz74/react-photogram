import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ArchiveImage, AuthContext, HideImage, ModalImage, OverlayLayer } from 'components';
import { auth } from 'firebase.configuration';
import { actionCreators } from 'state';
import { RootState } from 'state/reducers';
import { ImageInterface } from 'type';
import './UserGallery.css';

const UserGalleryInternal: React.FC = () => {
	const uid = useSelector((state: RootState) => state.auth.uid); // Get the UID from Redux
	const [modalIsOpen, setModalIsOpen] = React.useState<boolean>(false);
	const [modalImage, setModalImage] = React.useState<ImageInterface | null>(null);

	// To hide archived images
	const [showArchivedImages, setShowArchivedImages] = React.useState<boolean>(false);

	const openModal = (imageItem: ImageInterface) => {
		setModalImage(imageItem);
		setModalIsOpen(true);
	};

	const closeModal = () => setModalIsOpen(false);

	const imagesData: ImageInterface[] = useSelector((state: RootState) => state.images);
	const dispatch = useDispatch();

	React.useEffect(() => {
		console.log('>>> User Gallery');
		try {
			if (uid) {  // Only load images if UID is available
				dispatch(actionCreators.loadUserImages(showArchivedImages));
			} else {
				console.log("Waiting for UID to be set before loading images...");
			}
		} catch (error) {
			console.error(error);
		}
	}, [dispatch, showArchivedImages, uid]);

	const handleArchiveImage = (data: ImageInterface, archived: boolean) => {
		try {
			dispatch(actionCreators.archiveImage(data, archived));
			dispatch(actionCreators.loadUserImages(showArchivedImages));
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<div className="albumWrap">
			<div className="albumHeader">
				<div className="albumHeaderMenu">
					{uid && (
						<span
							className="menuItem"
							onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => setShowArchivedImages(!showArchivedImages)}
						>
							{`${!showArchivedImages ? 'Show' : 'Hide'} Archived`}
						</span>
					)}
				</div>
			</div>
			<div className="albumRow">
				{imagesData.length === 0 ? (
					<p>No images available</p>  // Placeholder to show when no images are loaded
				) : (
					imagesData.map((imageItem: ImageInterface, index: number) => {
						return (
							<div className="photoWrap" key={index}>
								<OverlayLayer>
									{uid && (
										<>
											<ArchiveImage
												imgData={imageItem}
												handleArchiveImage={handleArchiveImage}
												imgArchived={imageItem.imgArchived}
											/>
											<HideImage
												imgData={imageItem}
												handleHideImage={handleArchiveImage}
												imgPrivate={imageItem.imgPrivate}
											/>
										</>
									)}
									<div className="photoActionLayer" onClick={() => openModal(imageItem)}></div>
									{/* <span style={{ color: '#fff' }}>{imageItem.imgId}</span> */}
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

const UserGallery = React.memo(UserGalleryInternal);
UserGallery.displayName = 'UserGallery';
export { UserGallery };
