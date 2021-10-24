import React from 'react';
import { Link } from 'react-router-dom';
import { db, imagesDbCollection, storage } from 'firebase.configuration';
import './UploadImage.css';

export const UploadImage: React.FC = () => {
	const [image, setImage] = React.useState<File | null>(null);
	const [imageUrl, setImageUrl] = React.useState<string | null>(null);
	const [imageUploadProgress, setImageUploadProgress] = React.useState<number>(0);

	const handleChange = (files: FileList | null) => {
		if (files !== null) {
			setImageUploadProgress(0);
			setImage(files[0]);
		}
	};

	const handleUpload = () => {
		if (image !== null) {
			const uploadTask = storage.ref(`images/${image.name}`).put(image);
			uploadTask.on(
				'state_changed',
				snapshot => {
					const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
					setImageUploadProgress(progress);
				},
				error => {
					console.error(error);
				},
				() => {
					storage
						.ref('images')
						.child(image.name)
						.getDownloadURL()
						.then(url => {
							setImageUrl(url);
							db.collection(imagesDbCollection).add({
								imgArchived: false,
								imgSrc: url,
								imgName: image.name,
								imgUploadDate: Date.now(),
							});
						})
						.catch(error => {
							console.error(error);
						});
				},
			);
		} else {
			console.error(`Can't upload image`);
		}
	};

	return (
		<div className="uploadToolWrap">
			<div className="uploadToolHeader">
				<div className="headerTitle">Upload Files</div>
				<div className="headerCloseBtn">
					<Link to="/">
						<i className="icofont-close-line"></i>
					</Link>
				</div>
			</div>
			<div className="uploadToolBody">
				<div>
					<progress className="progressBar" value={imageUploadProgress} max="100" />
				</div>
				<div className="inputFileWrap">
					<input className="inputFile" type="file" onChange={e => handleChange(e.target.files)} />
				</div>
				<div className="buttonWrap">
					<button className="buttonMain" onClick={handleUpload}>
						Upload
					</button>
				</div>
				<div>
					{imageUploadProgress === 100 && <span className="fileUrl">{'Uploaded!'}</span>}
					{imageUrl && <img className="filePreview" src={imageUrl} alt="" />}
				</div>
			</div>
		</div>
	);
};

UploadImage.displayName = 'UploadImage';
