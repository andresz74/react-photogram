import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { db, imagesDbCollection } from 'firebase.configuration';
import { uploadImage } from 'api';
import { RootState } from 'state/reducers';
import './UploadImage.css';

export const UploadImage: React.FC = () => {
	const [image, setImage] = useState<File | null>(null);
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [imageUploadProgress, setImageUploadProgress] = useState<number>(0);
	const [isUploading, setIsUploading] = useState<boolean>(false); // New state to manage upload status
	const [imageDescription, setImageDescription] = useState<string>('');
	const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

	const userUID = useSelector((state: RootState) => state.auth.uid);
	console.log('User UID:', userUID);

	// Handle file selection
	const handleChange = (files: FileList | null) => {
		if (files) {
			setImageUploadProgress(0); // Reset progress when a new file is selected
			setImage(files[0]);
			if (files && files[0]) {
				setSelectedFileName(files[0].name); // Update state with file name
			}
		}
	};

	// Handle image upload using the backend API
	const handleUpload = async () => {
		if (image && !isUploading) {
			setIsUploading(true); // Disable upload button after upload starts
			setImageUploadProgress(10); // Set initial progress state (optional)

			try {
				// Use the API call to upload the image to the backend
				const imageUrl = await uploadImage(image);
				if (imageUrl) {
					setImageUrl(imageUrl);
					setImageUploadProgress(100); // Set progress to complete

					// Store the image metadata in Firestore
					try {
						await db.collection(imagesDbCollection).add({
							imgArchived: false,
							imgDescription: imageDescription || '',
							imgLikes: 0,
							imgName: image.name,
							imgPrivate: false,
							imgSrc: imageUrl,
							imgUploadDate: Date.now(),
							imgUserOwner: userUID,
						});
						console.log('Image uploaded and added to Firestore');
					} catch (error) {
						console.error('Error adding image metadata to Firestore:', error);
					}
					console.log('Image uploaded and added to Firestore');
				} else {
					console.error('Failed to upload image');
				}
			} catch (error) {
				console.error('Error uploading image:', error);
			} finally {
				setIsUploading(false); // Re-enable the button after upload completes
			}
		} else if (!image) {
			console.error('No image selected');
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
				{!imageUrl && <div className='uploadSection'>
					<div className="inputFileWrap">
						<input id="fileInput" className="inputFile" type="file" onChange={(e) => handleChange(e.target.files)} />
						<label htmlFor="fileInput" className="customFileInputLabel">
							Choose a file
						</label>
						{selectedFileName && <div className="fileName">{selectedFileName}</div>}
					</div>
					<div className="descriptionWrap">
						<textarea
							id="imageDescription"
							className="textareaDescription"
							placeholder="Enter a description for the image"
							value={imageDescription}
							onChange={(e) => setImageDescription(e.target.value)}
						/>
					</div>

					<div className='progressBarWrap'>
						<progress className="progressBar" value={imageUploadProgress} max="100" />
					</div>
					<div className="buttonWrap">
						<button className="buttonMain" onClick={handleUpload} disabled={!image || isUploading}>
							{isUploading ? 'Uploading...' : 'Upload'}
						</button>
					</div>
				</div>}
				<div>
					{imageUploadProgress === 100 && <span className="fileUrl">Uploaded!</span>}
					{imageUrl && <img className="filePreview" src={imageUrl} alt="" />}
				</div>
			</div>
		</div>
	);
};

UploadImage.displayName = 'UploadImage';
