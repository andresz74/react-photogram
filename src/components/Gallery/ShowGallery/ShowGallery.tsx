import React from 'react';
import { db, imagesDbCollection } from 'firebase.configuration';
import { ArchiveImage, AuthContext, DeleteImage, ModalImage, OverlayLayer } from 'components';
import { ImageInterface, PhotogramInterface } from 'interface';
import './ShowGallery.css';

const imagesRef = db.collection(imagesDbCollection);

const getImageList = async () => {
	const snapshot = await imagesRef.get();
	const data: ImageInterface[] = [];
	snapshot.forEach(doc => {
		data.push({
			imgId: doc.id,
			imgArchived: doc.data().imgArchived,
			imgUploadDate: doc.data().imgUploadDate,
			imgSrc: doc.data().imgSrc,
			imgName: doc.data().imgName,
		});
	});
	return data;
};

const ShowGalleryInternal: React.FC = () => {
	const [modalIsOpen, setModalIsOpen] = React.useState<boolean>(false);
	const [modalImage, setModalImage] = React.useState<ImageInterface | null>(null);
	const user = React.useContext(AuthContext);
	const [imagesList, setImagesList] = React.useState<ImageInterface[]>([]);

	const openModal = (imageItem: ImageInterface) => {
		setModalImage(imageItem);
		setModalIsOpen(true);
	};
	const closeModal = () => setModalIsOpen(false);

	React.useEffect(() => {
		getImageList().then(results => setImagesList(results));
	}, []);

	return (
		<div className="albumWrap">
			<div className="albumRow">
				{imagesList.map((imageItem: ImageInterface, index: number) => {
					return !imageItem.imgArchived && (
						<div className="photoWrap" key={index}>
							<OverlayLayer>
								{user && <ArchiveImage imgData={imageItem} />}
								{user && <DeleteImage imgData={imageItem} />}
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

ShowGalleryInternal.displayName = 'ShowGallery';
const ShowGallery = React.memo(ShowGalleryInternal);
export { ShowGallery };
