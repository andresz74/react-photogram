import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from 'state/store';
import { useLocation } from 'react-router-dom';
import { deleteImage } from 'api';
import { ArchiveImage, DeleteImage, HideImage, ModalImage, OverlayLayer } from 'components';
import { actionCreators } from 'state';
import { RootState } from 'state/reducers';
import { ImageInterface } from 'type';
import { logger } from 'utils/logger';
import './ShowGallery.css';

export interface ComponentProps {
	uid?: string | null;
}

const ShowGalleryInternal: React.FC<ComponentProps> = ({ uid }) => {
	const [modalIsOpen, setModalIsOpen] = React.useState<boolean>(false);
	const [modalImage, setModalImage] = React.useState<ImageInterface | null>(null);
	// To hide archived images
	const [showArchivedImages, setShowArchivedImages] = React.useState<boolean>(false);
	const [isDeletingId, setIsDeletingId] = React.useState<string | null>(null);
	const [deleteStatus, setDeleteStatus] = React.useState<{ kind: 'success' | 'error'; message: string } | null>(null);
	const location = useLocation();

	const openModal = (imageItem: ImageInterface) => {
		setModalImage(imageItem);
		setModalIsOpen(true);
	};

	const closeModal = () => setModalIsOpen(false);

	const imagesData = useSelector<RootState, ImageInterface[]>((state) => (uid ? state.userImages : state.images));
	const galleryRequest = useSelector((state: RootState) => (uid ? state.requestStatus.userGallery : state.requestStatus.publicGallery));

	
	const dispatch: AppDispatch = useDispatch();

	React.useEffect(() => {
		const result = uid
			? dispatch(actionCreators.loadUserImages(showArchivedImages))
			: dispatch(actionCreators.loadImages());

		Promise.resolve(result).catch(error => logger.error('Failed to load gallery images:', error));
	}, [dispatch, showArchivedImages, uid]);

	React.useEffect(() => {
		// Clear images on route change
		return () => {
			dispatch(actionCreators.clearImages());
		};
	}, [location.pathname, dispatch]);

	const handleArchiveImage = async (data: ImageInterface, archived: boolean) => {
		try {
			const shouldRemoveFromList = Boolean(uid) && !showArchivedImages && archived === false;
			await dispatch(actionCreators.archiveImage(data, archived, shouldRemoveFromList));
		} catch (error) {
			logger.error('Unable to archive image:', error);
		}
	};

	const handlePrivateImage = async (data: ImageInterface, isPrivate: boolean) => {
		try {
			await dispatch(actionCreators.togglePrivateImage(data, isPrivate));
		} catch (error) {
			logger.error('Unable to update image privacy:', error);
		}
	};

	const refreshGallery = async () => {
		if (uid) {
			await dispatch(actionCreators.loadUserImages(showArchivedImages));
			return;
		}
		await dispatch(actionCreators.loadImages());
	};

	const handleDeleteImage = async (data: ImageInterface) => {
		const imageId = data.imgId ?? data.imgName;
		setIsDeletingId(imageId);
		setDeleteStatus(null);

		try {
			await deleteImage(data);
			await refreshGallery();
			setDeleteStatus({ kind: 'success', message: 'Image deleted successfully.' });
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unable to delete image.';
			setDeleteStatus({ kind: 'error', message });
		} finally {
			setIsDeletingId(null);
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
			{deleteStatus && (
				<div className={`galleryNotice galleryNotice${deleteStatus.kind === 'success' ? 'Success' : 'Error'}`} role="status">
					{deleteStatus.message}
				</div>
			)}
			{galleryRequest.status === 'failed' && galleryRequest.error && (
				<div className="galleryNotice galleryNoticeError" role="alert">
					{galleryRequest.error}
				</div>
			)}
			<div className="albumRow">
				{imagesData.length === 0 ? (
					<p>No images available</p>  // Placeholder to show when no images are loaded
				) : (
					imagesData.map((imageItem: ImageInterface, index: number) => {
						const key = imageItem.imgId ?? imageItem.imgSrc ?? String(index);
						return (
							<div className="photoWrap" key={key}>
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
												handleHideImage={handlePrivateImage}
												imgPrivate={imageItem.imgPrivate}
											/>
											<DeleteImage
												imgData={imageItem}
												isDeleting={isDeletingId === key}
												onDelete={handleDeleteImage}
											/>
										</>
									)}
									<div className="photoActionLayer" onClick={() => openModal(imageItem)}></div>
								</OverlayLayer>
								<img src={imageItem.imgSrc} alt={imageItem.imgName} loading="lazy" />
							</div>
						);
					})
				)}
			</div>
			{modalImage !== null && (
				<ModalImage imgSrc={modalImage.imgSrc} imgName={modalImage.imgName} imgDescription={modalImage.imgDescription} imgLikes={modalImage.imgLikes} isOpen={modalIsOpen} onClose={closeModal} />
			)}
		</div>
	);
};

const ShowGallery = React.memo(ShowGalleryInternal);
ShowGallery.displayName = 'ShowGallery';
export { ShowGallery };
