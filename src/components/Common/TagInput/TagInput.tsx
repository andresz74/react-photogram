import React, { useState } from 'react';
import './TagInput.css';

const DEFAULT_MAX_TAGS = 10;
const DEFAULT_MAX_LENGTH = 32;

type NormalizedTag = {
	label: string;
	slug: string;
};

export type TagInputProps = {
	value: string[];
	onChange: (tags: string[]) => void;
	maxTags?: number;
	maxLength?: number;
	disabled?: boolean;
	id?: string;
	label?: string;
};

export const createTagSlug = (label: string) =>
	label
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-');

export const normalizeTagLabel = (rawValue: string): NormalizedTag | null => {
	const label = rawValue
		.trim()
		.replace(/^#+/, '')
		.trim()
		.replace(/\s+/g, ' ');

	if (!label) return null;

	return {
		label,
		slug: createTagSlug(label),
	};
};

const hasControlCharacters = (value: string) => {
	for (let index = 0; index < value.length; index += 1) {
		const charCode = value.charCodeAt(index);
		if (charCode < 32 || charCode === 127) return true;
	}

	return false;
};

export const TagInput: React.FC<TagInputProps> = ({
	value,
	onChange,
	maxTags = DEFAULT_MAX_TAGS,
	maxLength = DEFAULT_MAX_LENGTH,
	disabled = false,
	id = 'tagInput',
	label = 'Tags',
}) => {
	const [inputValue, setInputValue] = useState('');
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const commitTags = (rawValues: string[]) => {
		if (disabled) return;

		let nextTags = [...value];
		let nextError: string | null = null;

		rawValues.forEach(rawValue => {
			const normalized = normalizeTagLabel(rawValue);

			if (!normalized) {
				nextError = 'Enter a tag before adding it.';
				return;
			}

			if (hasControlCharacters(normalized.label)) {
				nextError = 'Tags cannot contain control characters.';
				return;
			}

			if (normalized.label.includes(',')) {
				nextError = 'Tags cannot contain commas.';
				return;
			}

			if (normalized.label.length > maxLength) {
				nextError = `Tags must be ${maxLength} characters or fewer.`;
				return;
			}

			if (nextTags.length >= maxTags) {
				nextError = `You can add up to ${maxTags} tags.`;
				return;
			}

			const slugExists = nextTags.some(tag => createTagSlug(tag) === normalized.slug);
			if (slugExists) return;

			nextTags = [...nextTags, normalized.label];
		});

		if (nextTags.length !== value.length) {
			onChange(nextTags);
			setInputValue('');
		}

		setErrorMessage(nextError);
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (disabled) return;

		if (event.key === 'Enter' || event.key === 'Tab') {
			if (!inputValue.trim()) return;
			event.preventDefault();
			commitTags([inputValue]);
			return;
		}

		if (event.key === 'Backspace' && !inputValue && value.length > 0) {
			onChange(value.slice(0, -1));
			setErrorMessage(null);
		}
	};

	const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
		if (disabled) return;

		const pastedText = event.clipboardData.getData('text');
		if (!pastedText.includes(',')) return;

		event.preventDefault();
		commitTags(pastedText.split(','));
	};

	const removeTag = (tagToRemove: string) => {
		if (disabled) return;
		onChange(value.filter(tag => tag !== tagToRemove));
		setErrorMessage(null);
	};

	return (
		<div className="tagInputWrap">
			<label className="fieldLabel" htmlFor={id}>{label}</label>
			<div className={`tagInputBox ${disabled ? 'tagInputBoxDisabled' : ''}`}>
				{value.map(tag => (
					<span className="tagChip" key={createTagSlug(tag)}>
						<span>{tag}</span>
						<button
							type="button"
							className="tagRemoveButton"
							disabled={disabled}
							aria-label={`Remove tag ${tag}`}
							onClick={() => removeTag(tag)}
						>
							×
						</button>
					</span>
				))}
				<input
					id={id}
					className="tagInputField"
					type="text"
					value={inputValue}
					disabled={disabled}
					placeholder={value.length ? 'Add another tag' : 'Add a tag'}
					onChange={(event) => {
						setInputValue(event.target.value);
						setErrorMessage(null);
					}}
					onKeyDown={handleKeyDown}
					onPaste={handlePaste}
					aria-describedby={`${id}-help ${id}-count ${id}-error`}
				/>
			</div>
			<div className="tagInputMeta">
				<span id={`${id}-help`}>Press Enter to add a tag. Spaces are okay.</span>
				<span id={`${id}-count`}>{value.length}/{maxTags} tags</span>
			</div>
			{errorMessage && (
				<div id={`${id}-error`} className="tagInputError" role="alert">
					{errorMessage}
				</div>
			)}
		</div>
	);
};

TagInput.displayName = 'TagInput';
