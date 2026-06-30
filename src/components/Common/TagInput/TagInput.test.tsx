import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TagInput, createTagSlug } from './TagInput';

const ControlledTagInput = ({ disabled = false }: { disabled?: boolean }) => {
	const [tags, setTags] = React.useState<string[]>([]);
	return <TagInput value={tags} onChange={setTags} disabled={disabled} />;
};

const typeTag = (value: string, key = 'Enter') => {
	const input = screen.getByLabelText('Tags');
	fireEvent.change(input, { target: { value } });
	fireEvent.keyDown(input, { key });
};

test('initial render shows helper text and tag count', () => {
	render(<ControlledTagInput />);

	expect(screen.getByText('Press Enter to add a tag. Spaces are okay.')).toBeInTheDocument();
	expect(screen.getByText('0/10 tags')).toBeInTheDocument();
});

test('pressing Enter adds a tag', () => {
	render(<ControlledTagInput />);

	typeTag('dog');

	expect(screen.getByText('dog')).toBeInTheDocument();
	expect(screen.getByText('1/10 tags')).toBeInTheDocument();
});

test('spaces inside tags are preserved after whitespace normalization', () => {
	render(<ControlledTagInput />);

	typeTag('golden   retriever');

	expect(screen.getByText('golden retriever')).toBeInTheDocument();
});

test('leading hash characters are stripped', () => {
	render(<ControlledTagInput />);

	typeTag('#Dog');

	expect(screen.getByText('Dog')).toBeInTheDocument();
	expect(createTagSlug('Dog')).toBe('dog');
});

test('duplicate tags are ignored case-insensitively', () => {
	render(<ControlledTagInput />);

	typeTag('Dog');
	typeTag('dog');

	expect(screen.getByText('Dog')).toBeInTheDocument();
	expect(screen.queryByText('dog')).not.toBeInTheDocument();
	expect(screen.getByText('1/10 tags')).toBeInTheDocument();
});

test('removing a chip works', () => {
	render(<ControlledTagInput />);

	typeTag('dog');
	fireEvent.click(screen.getByRole('button', { name: 'Remove tag dog' }));

	expect(screen.queryByText('dog')).not.toBeInTheDocument();
	expect(screen.getByText('0/10 tags')).toBeInTheDocument();
});

test('Backspace removes the last chip when input is empty', () => {
	render(<ControlledTagInput />);

	typeTag('dog');
	fireEvent.keyDown(screen.getByLabelText('Tags'), { key: 'Backspace' });

	expect(screen.queryByText('dog')).not.toBeInTheDocument();
});

test('max tag count is enforced', () => {
	render(<ControlledTagInput />);

	for (let index = 1; index <= 10; index += 1) {
		typeTag(`tag ${index}`);
	}
	typeTag('tag 11');

	expect(screen.getByText('10/10 tags')).toBeInTheDocument();
	expect(screen.queryByText('tag 11')).not.toBeInTheDocument();
	expect(screen.getByRole('alert')).toHaveTextContent('You can add up to 10 tags.');
});

test('max tag length is enforced', () => {
	render(<ControlledTagInput />);

	typeTag('a'.repeat(33));

	expect(screen.getByRole('alert')).toHaveTextContent('Tags must be 32 characters or fewer.');
	expect(screen.getByText('0/10 tags')).toBeInTheDocument();
});

test('32-character tags are allowed', () => {
	const tag = 'a'.repeat(32);
	render(<ControlledTagInput />);

	typeTag(tag);

	expect(screen.getByText(tag)).toBeInTheDocument();
	expect(screen.getByText('1/10 tags')).toBeInTheDocument();
});

test('pasted comma-separated values become multiple chips', () => {
	render(<ControlledTagInput />);

	fireEvent.paste(screen.getByLabelText('Tags'), {
		clipboardData: {
			getData: () => 'dog, golden retriever, New York',
		},
	});

	expect(screen.getByText('dog')).toBeInTheDocument();
	expect(screen.getByText('golden retriever')).toBeInTheDocument();
	expect(screen.getByText('New York')).toBeInTheDocument();
	expect(screen.getByText('3/10 tags')).toBeInTheDocument();
});

test('commas inside final labels are rejected for typed tags', () => {
	render(<ControlledTagInput />);

	typeTag('dog,cat');

	expect(screen.getByRole('alert')).toHaveTextContent('Tags cannot contain commas.');
	expect(screen.getByText('0/10 tags')).toBeInTheDocument();
});

test('control characters are rejected', () => {
	render(<ControlledTagInput />);

	typeTag('bad\u0007tag');

	expect(screen.getByRole('alert')).toHaveTextContent('Tags cannot contain control characters.');
	expect(screen.getByText('0/10 tags')).toBeInTheDocument();
});

test('disabled state prevents edits', () => {
	render(<ControlledTagInput disabled />);

	const input = screen.getByLabelText('Tags');
	expect(input).toBeDisabled();
	fireEvent.change(input, { target: { value: 'dog' } });
	fireEvent.keyDown(input, { key: 'Enter' });

	expect(screen.queryByText('dog')).not.toBeInTheDocument();
	expect(screen.getByText('0/10 tags')).toBeInTheDocument();
});
