import React from 'react';
import { db, imagesDbCollection } from 'firebase.configuration';
import { AuthContext, DeleteImage, ModalImage, OverlayLayer } from 'components';
import './ShowGallery.css';

export interface PhotogramInterface {
	imagesArray: ImageInterface[];
}

export interface ImageInterface {
	imgId: string;
	imgName: string;
	imgSrc: string;
	imgUploadDate: number;
}

const imagesRef = db.collection(imagesDbCollection);

const getImageList = async () => {
	const snapshot = await imagesRef.get();
	const data: ImageInterface[] = [];
	snapshot.forEach(doc => {
		data.push({
			imgId: doc.id,
			imgUploadDate: doc.data().imgUploadDate,
			imgSrc: doc.data().imgSrc,
			imgName: doc.data().imgName,
		});
	});
	return data;
};

export const ShowGallery: React.FC = () => {
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
					return (
						<div className="photoWrap" key={index}>
							<OverlayLayer onClick={() => openModal(imageItem)}>
								{user && <DeleteImage imgData={imageItem} />}
							</OverlayLayer>
							<img src={imageItem.imgSrc} alt={imageItem.imgName} />
						</div>
					);
				})}
			</div>
			{modalImage !== null && (
				<ModalImage imgSrc={modalImage.imgSrc} imgAlt={modalImage.imgName} isOpen={modalIsOpen} />
			)}
		</div>
	);
};

ShowGallery.displayName = 'ShowGallery';
