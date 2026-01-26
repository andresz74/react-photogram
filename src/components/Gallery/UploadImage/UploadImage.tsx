import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { db, imagesDbCollection } from 'firebase.configuration';
import { uploadImage } from 'api';
import { RootState } from 'state/reducers';
import { logger } from 'utils/logger';
import './UploadImage.css';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

type UploadStatus = 'idle' | 'uploading' | 'saving' | 'success' | 'error';
type UploadStageLabel = 'Uploading…' | 'Processing…' | null;

export const UploadImage: React.FC = () => {
	const inputIdRef = React.useRef(`fileInput-${Math.random().toString(36).slice(2)}`);
	const [image, setImage] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
	const [status, setStatus] = useState<UploadStatus>('idle');
	const [uploadStage, setUploadStage] = useState<UploadStageLabel>(null);
	const [uploadPercent, setUploadPercent] = useState<number>(0);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [imageDescription, setImageDescription] = useState<string>('');
	const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
	const [isPrivate, setIsPrivate] = useState<boolean>(false);

	const userUID = useSelector((state: RootState) => state.auth.uid);
	logger.debug('User UID:', userUID);

	const isBusy = status === 'uploading' || status === 'saving';
	const canUpload = Boolean(userUID) && Boolean(image) && !isBusy;

	const fileMeta = useMemo(() => {
		if (!image) return null;
		return {
			sizeLabel: `${(image.size / (1024 * 1024)).toFixed(2)} MB`,
			typeLabel: image.type || 'unknown',
		};
	}, [image]);

	const validateFile = (file: File): string | null => {
		if (!file.type?.startsWith('image/')) return 'Please choose an image file.';
		if (file.size > MAX_UPLOAD_BYTES) return 'File is too large (max 10MB).';
		return null;
	};

	const resetForm = () => {
		setImage(null);
		setSelectedFileName(null);
		setImageDescription('');
		setIsPrivate(false);
		setPreviewUrl(null);
		setUploadedUrl(null);
		setStatus('idle');
		setUploadStage(null);
		setUploadPercent(0);
		setErrorMessage(null);
	};

	React.useEffect(() => {
		if (!image) {
			setPreviewUrl(null);
			return;
		}

		const nextUrl = URL.createObjectURL(image);
		setPreviewUrl(nextUrl);
		return () => URL.revokeObjectURL(nextUrl);
	}, [image]);

	// Handle file selection
	const handleChange = (files: FileList | null) => {
		if (!files || files.length === 0) return;
		const nextFile = files[0];

		setErrorMessage(null);
		setStatus('idle');
		setUploadedUrl(null);
		setUploadStage(null);
		setUploadPercent(0);

		const validationError = validateFile(nextFile);
		if (validationError) {
			setImage(null);
			setSelectedFileName(null);
			setErrorMessage(validationError);
			setStatus('error');
			return;
		}

		setImage(nextFile);
		setSelectedFileName(nextFile.name);
	};

	// Handle image upload using the backend API
	const handleUpload = async () => {
		if (!userUID) {
			setErrorMessage('Please log in to upload images.');
			setStatus('error');
			return;
		}

		if (!image || isBusy) return;

		setErrorMessage(null);
		setUploadPercent(0);
		setUploadStage('Uploading…');
		setStatus('uploading');

		try {
			const url = await uploadImage(image, {
				onProgress: setUploadPercent,
				onStage: (stage) => setUploadStage(stage === 'uploading' ? 'Uploading…' : 'Processing…'),
			});
			if (!url) throw new Error('Upload failed.');

			setUploadStage(null);
			setStatus('saving');
			await db.collection(imagesDbCollection).add({
				imgArchived: false,
				imgDescription: imageDescription || '',
				imgLikes: 0,
				imgName: image.name,
				imgPrivate: isPrivate,
				imgSrc: url,
				imgUploadDate: Date.now(),
				imgUserOwner: userUID,
			});

			setUploadedUrl(url);
			setStatus('success');
			setUploadPercent(100);
			logger.debug('Image uploaded and saved');
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			logger.error('Error uploading image:', error);
			setErrorMessage(message);
			setUploadStage(null);
			setStatus('error');
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
				{!userUID && (
					<div className="uploadNotice">
						<p className="uploadNoticeText">You must be logged in to upload images.</p>
						<Link className="uploadNoticeLink" to="/login">
							Go to Login
						</Link>
					</div>
				)}

				<div className="uploadSection" aria-busy={isBusy}>
					<div
						className="dropZone"
						onDragOver={(e) => e.preventDefault()}
						onDrop={(e) => {
							e.preventDefault();
							handleChange(e.dataTransfer.files);
						}}
					>
						<input
							id={inputIdRef.current}
							className="inputFile"
							type="file"
							accept="image/*"
							disabled={!userUID || isBusy}
							onChange={(e) => handleChange(e.target.files)}
						/>
						<label htmlFor={inputIdRef.current} className="customFileInputLabel">
							{selectedFileName ? 'Change file' : 'Choose a file'}
						</label>
						<div className="dropZoneHint">or drag & drop an image</div>
						{selectedFileName && (
							<div className="fileMeta">
								<div className="fileName">{selectedFileName}</div>
								{fileMeta && <div className="fileDetails">{fileMeta.sizeLabel} · {fileMeta.typeLabel}</div>}
							</div>
						)}
					</div>

					<div className="previewWrap">
						{previewUrl && (
							<img
								className="filePreview"
								src={previewUrl}
								alt={selectedFileName ?? 'Selected image preview'}
								loading="lazy"
								decoding="async"
							/>
						)}
						{uploadedUrl && (
							<div className="uploadedMeta">
								<div className="uploadSuccess">Uploaded</div>
								<a className="uploadedLink" href={uploadedUrl} target="_blank" rel="noreferrer">
									Open image
								</a>
								<button type="button" className="buttonSecondary" onClick={resetForm}>
									Upload another
								</button>
							</div>
						)}
					</div>

					<div className="descriptionWrap">
						<label className="fieldLabel" htmlFor="imageDescription">
							Description
						</label>
						<textarea
							id="imageDescription"
							className="textareaDescription"
							placeholder="Add a description (optional)"
							value={imageDescription}
							disabled={!userUID || isBusy}
							maxLength={500}
							onChange={(e) => setImageDescription(e.target.value)}
						/>
						<div className="fieldHelp">{imageDescription.length}/500</div>
					</div>

					<div className="toggleRow">
						<label className="toggleLabel">
							<input
								type="checkbox"
								checked={isPrivate}
								disabled={!userUID || isBusy}
								onChange={(e) => setIsPrivate(e.target.checked)}
							/>
							<span>Private</span>
						</label>
					</div>

					{errorMessage && <div className="uploadError" role="alert">{errorMessage}</div>}

					{uploadStage && (
						<div className="uploadStageRow" role="status" aria-live="polite">
							<span className="uploadStage">{uploadStage}</span>
							<span className="uploadPercent">{uploadPercent}%</span>
						</div>
					)}

					<div className="progressBarWrap">
						{status === 'uploading' ? (
							<progress className="progressBar" value={uploadPercent} max={100} />
						) : status === 'saving' ? (
							<progress className="progressBar" />
						) : status === 'success' ? (
							<progress className="progressBar" value={100} max={100} />
						) : (
							<progress className="progressBar" value={0} max={100} />
						)}
					</div>

					<div className="buttonWrap">
						<button className="buttonMain" onClick={handleUpload} disabled={!canUpload}>
							{status === 'uploading' ? 'Uploading…' : status === 'saving' ? 'Saving…' : 'Upload'}
						</button>
						<button
							type="button"
							className="buttonSecondary"
							onClick={resetForm}
							disabled={isBusy || (!image && !uploadedUrl && !imageDescription && !isPrivate)}
						>
							Reset
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

UploadImage.displayName = 'UploadImage';
