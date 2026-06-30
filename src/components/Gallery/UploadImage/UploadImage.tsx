import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { auth } from 'firebase.configuration';
import { uploadImage } from 'api';
import { TagInput } from 'components/Common';
import type { AppDispatch } from 'state';
import { actionCreators } from 'state';
import { RootState } from 'state/reducers';
import { logger } from 'utils/logger';
import './UploadImage.css';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
const SUPPORTED_FORMATS = '.jpg, .jpeg, .png';

type UploadStatus = 'idle' | 'selected' | 'uploading' | 'success' | 'error';
type UploadStageLabel = 'Uploading…' | null;

export const UploadImage: React.FC = () => {
	const inputIdRef = React.useRef(`fileInput-${Math.random().toString(36).slice(2)}`);
	const inputRef = React.useRef<HTMLInputElement | null>(null);
	const [image, setImage] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
	const [status, setStatus] = useState<UploadStatus>('idle');
	const [uploadStage, setUploadStage] = useState<UploadStageLabel>(null);
	const [uploadPercent, setUploadPercent] = useState<number>(0);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [imageDescription, setImageDescription] = useState<string>('');
	const [imageTags, setImageTags] = useState<string[]>([]);
	const [savedTags, setSavedTags] = useState<string[]>([]);
	const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
	const [isPrivate, setIsPrivate] = useState<boolean>(false);

	const userUID = useSelector((state: RootState) => state.auth.uid);
	const dispatch = useDispatch<AppDispatch>();
	logger.debug('User UID:', userUID);

	const isBusy = status === 'uploading';
	const hasSelectedFile = Boolean(image);
	const canUpload = Boolean(userUID) && Boolean(image) && !isBusy && status !== 'success';

	const fileMeta = useMemo(() => {
		if (!image) return null;
		return {
			sizeLabel: `${(image.size / (1024 * 1024)).toFixed(2)} MB`,
			typeLabel: image.type || 'unknown',
		};
	}, [image]);

	const maxFileSizeLabel = useMemo(() => `${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))}MB`, []);

	const validateFile = (file: File): string | null => {
		if (!file.type?.startsWith('image/')) return 'Please choose an image file.';
		if (file.size <= 0) return 'Please choose a non-empty image file.';
		if (file.size > MAX_UPLOAD_BYTES) return `File is too large (max ${maxFileSizeLabel}).`;
		return null;
	};

	const resetForm = () => {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		setImage(null);
		setSelectedFileName(null);
		setImageDescription('');
		setImageTags([]);
		setSavedTags([]);
		setIsPrivate(false);
		setPreviewUrl(null);
		setUploadedUrl(null);
		setStatus('idle');
		setUploadStage(null);
		setUploadPercent(0);
		setErrorMessage(null);
		if (inputRef.current) inputRef.current.value = '';
		dispatch(actionCreators.setAsyncStatus('upload', 'idle'));
	};

	React.useEffect(() => {
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
		};
	}, [previewUrl]);

	const openFilePicker = () => {
		if (!userUID || isBusy) return;
		inputRef.current?.click();
	};

	const handleDropZoneKeyDown = (event: React.KeyboardEvent<HTMLLabelElement>) => {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		openFilePicker();
	};

	const handleChange = (files: FileList | null) => {
		if (!files || files.length === 0) return;
		const nextFile = files[0];

		setErrorMessage(null);
		setStatus('selected');
		setUploadedUrl(null);
		setUploadStage(null);
		setUploadPercent(0);
		dispatch(actionCreators.setAsyncStatus('upload', 'idle'));

		const validationError = validateFile(nextFile);
		if (validationError) {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			setImage(null);
			setSelectedFileName(null);
			setPreviewUrl(null);
			setErrorMessage(validationError);
			setStatus('error');
			dispatch(actionCreators.setAsyncStatus('upload', 'failed', validationError));
			if (inputRef.current) inputRef.current.value = '';
			return;
		}

		if (previewUrl) URL.revokeObjectURL(previewUrl);
		setPreviewUrl(URL.createObjectURL(nextFile));
		setImage(nextFile);
		setSelectedFileName(nextFile.name);
	};

	const handleUpload = async () => {
		if (!userUID) {
			const message = 'Please log in to upload images.';
			setErrorMessage(message);
			setStatus('error');
			dispatch(actionCreators.setAsyncStatus('upload', 'failed', message));
			return;
		}

		if (!image || isBusy) return;

		const currentUser = auth.currentUser;
		if (!currentUser) {
			const message = 'Please log in to upload images.';
			setErrorMessage(message);
			setStatus('error');
			dispatch(actionCreators.setAsyncStatus('upload', 'failed', message));
			return;
		}

		setErrorMessage(null);
		setUploadPercent(0);
		setUploadStage('Uploading…');
		setStatus('uploading');
		dispatch(actionCreators.setAsyncStatus('upload', 'loading'));

		try {
			const idToken = await currentUser.getIdToken();
			const uploadedImage = await uploadImage({
				file: image,
				idToken,
				description: imageDescription || undefined,
				isPublic: !isPrivate,
				...(imageTags.length > 0 ? { tags: imageTags } : {}),
			});
			if (!uploadedImage.imageUrl) throw new Error('Upload failed.');

			setUploadStage(null);
			setUploadedUrl(uploadedImage.imageUrl);
			setSavedTags(uploadedImage.tags ?? []);
			setStatus('success');
			setUploadPercent(100);
			dispatch(actionCreators.setAsyncStatus('upload', 'succeeded'));
			logger.debug('Image uploaded');
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			logger.error('Error uploading image:', error);
			setErrorMessage(message);
			setUploadStage(null);
			setStatus('error');
			dispatch(actionCreators.setAsyncStatus('upload', 'failed', message));
		}
	};

	const renderDropZone = () => (
		<label
			htmlFor={inputIdRef.current}
			className={`dropZone ${hasSelectedFile ? 'dropZoneCompact' : 'dropZoneEmpty'}`}
			role="button"
			tabIndex={userUID && !isBusy ? 0 : -1}
			onKeyDown={handleDropZoneKeyDown}
			onDragOver={(e) => e.preventDefault()}
			onDrop={(e) => {
				e.preventDefault();
				if (!userUID || isBusy) return;
				handleChange(e.dataTransfer.files);
			}}
		>
			<input
				ref={inputRef}
				id={inputIdRef.current}
				className="inputFile"
				type="file"
				accept="image/*"
				disabled={!userUID || isBusy}
				aria-label="Choose an image to upload"
				onChange={(e) => handleChange(e.target.files)}
			/>
			{hasSelectedFile ? (
				<>
					<span className="customFileInputLabel">Change file</span>
					<div className="dropZoneHint">or drag & drop another image</div>
					{selectedFileName && (
						<div className="fileMeta">
							<div className="fileName">{selectedFileName}</div>
							{fileMeta && <div className="fileDetails">{fileMeta.sizeLabel} · {fileMeta.typeLabel}</div>}
						</div>
					)}
				</>
			) : (
				<>
					<div className="dropZoneIcon" aria-hidden="true">
						<i className="icofont-image"></i>
						<span className="dropZoneUploadBadge">
							<i className="icofont-upload-alt"></i>
						</span>
					</div>
					<div className="dropZonePrimary"><span>Click to upload</span> or Drag & Drop</div>
					<div className="dropZoneHelper">Supported formats: {SUPPORTED_FORMATS}</div>
					<div className="dropZoneHelper">Maximum file size of {maxFileSizeLabel}.</div>
				</>
			)}
		</label>
	);

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
					{status !== 'success' && renderDropZone()}
					{errorMessage && !image && <div className="uploadError" role="alert">{errorMessage}</div>}

					{status === 'success' ? (
						<div className="successState">
							{previewUrl && (
								<img
									className="filePreview"
									src={previewUrl}
									alt={selectedFileName ?? 'Uploaded image preview'}
									loading="lazy"
									decoding="async"
								/>
							)}
							<div className="uploadedMeta" role="status" aria-live="polite">
								<div className="uploadSuccess">Uploaded</div>
								{savedTags.length > 0 && (
									<div className="uploadedTags" aria-label="Uploaded tags">
										{savedTags.map(tag => <span className="tagChip" key={tag}>{tag}</span>)}
									</div>
								)}
								{uploadedUrl && (
									<a className="uploadedLink" href={uploadedUrl} target="_blank" rel="noreferrer">
										Open image
									</a>
								)}
								<button type="button" className="buttonSecondary buttonFull" onClick={resetForm}>
									Upload another
								</button>
							</div>
						</div>
					) : hasSelectedFile ? (
						<>
							{previewUrl && (
								<div className="previewWrap">
									<img
										className="filePreview"
										src={previewUrl}
										alt={selectedFileName ?? 'Selected image preview'}
										loading="lazy"
										decoding="async"
									/>
								</div>
							)}

							<div className="metadataPanel">
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

								<TagInput
									id="imageTags"
									value={imageTags}
									onChange={setImageTags}
									disabled={!userUID || isBusy}
								/>

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
							</div>

							{errorMessage && <div className="uploadError" role="alert">{errorMessage}</div>}

							{status === 'uploading' && uploadStage && (
								<>
									<div className="uploadStageRow" role="status" aria-live="polite">
										<span className="uploadStage">{uploadStage}</span>
										<span className="uploadPercent">{uploadPercent}%</span>
									</div>
									<div className="progressBarWrap">
										<progress className="progressBar" value={uploadPercent} max={100} />
									</div>
								</>
							)}

							<div className="buttonWrap">
								<button className="buttonMain" onClick={handleUpload} disabled={!canUpload}>
									{status === 'uploading' ? 'Uploading…' : 'Upload'}
								</button>
								<button type="button" className="buttonSecondary" onClick={resetForm} disabled={isBusy}>
									Reset
								</button>
							</div>
						</>
					) : null}
				</div>
			</div>
		</div>
	);
};

UploadImage.displayName = 'UploadImage';
