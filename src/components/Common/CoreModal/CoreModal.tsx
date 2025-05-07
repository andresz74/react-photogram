import React from 'react';
import ReactModal from 'react-modal';
import './CoreModal.css';
const Modal = ReactModal as unknown as React.ComponentType<ReactModal.Props>;

export interface ComponentProps extends ReactModal.Props {
	className?: string;
	footerChildren?: React.ReactElement;
	isOpen: boolean;
	overlayClassName?: string;
	headerChildren?: React.ReactElement;
	onRequestClose?: (event: React.MouseEvent | React.KeyboardEvent) => void;
}

export const CoreModal: React.FC<ComponentProps & { children?: React.ReactNode }> = ({
	children,
	className,
	footerChildren,
	isOpen,
	overlayClassName,
	headerChildren,
	onRequestClose,
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
			<i className="icofont-close-line modalCloseIco" onClick={handleOnClose}></i>
			{headerChildren && <div className="modalHeader">
				{headerChildren}
			</div>}
			<div className='modalBody'>
				{children}
			</div>
			{footerChildren && <div className='modalFooter'>
				{footerChildren}
			</div>}
		</Modal>
	);
};

CoreModal.displayName = 'CoreModal';
