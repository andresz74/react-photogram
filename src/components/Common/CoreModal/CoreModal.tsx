import React from 'react';
import Modal from 'react-modal';
import './CoreModal.css';

export interface ComponentProps extends Modal.Props {
	className?: string;
	overlayClassName?: string;
	isOpen: boolean;
	title?: string;
	onRequestClose?: (event: React.MouseEvent | React.KeyboardEvent) => void;
}

export const CoreModal: React.FC<ComponentProps & { children?: React.ReactNode }> = ({
	className,
	overlayClassName,
	title,
	isOpen,
	onRequestClose,
	children,
	...otherProps
}) => {
	const reactModalProps = { onRequestClose, ...otherProps };

	const handleOnClose = React.useCallback(
		(event: React.MouseEvent): void => {
			if (onRequestClose) {
				onRequestClose(event);
			}
		},
		[onRequestClose],
	);

	return (
		<Modal
			className={`modalCore ${className ?? ''}`}
			overlayClassName={`modalOverlay ${overlayClassName ?? ''}`}
			isOpen={isOpen}
			ariaHideApp={false}
			{...reactModalProps}
		>
			<div className="modalHeader" onClick={handleOnClose}>
				{title && <div className="modalTitle">{title}</div>}
				<i className="icofont-close-line modalCloseIco"></i>
			</div>
			{children}
		</Modal>
	);
};

CoreModal.displayName = 'CoreModal';
