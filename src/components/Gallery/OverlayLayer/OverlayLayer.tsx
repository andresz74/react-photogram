import React from 'react';
import './OverlayLayer.css';

export interface ComponentProps {
	onClick?: (e: React.MouseEvent) => void;
}

export const OverlayLayer: React.FC<ComponentProps & { children?: React.ReactNode }> = ({ onClick, children }) => {
	return (
		<div className="overlayLayerWrap" onClick={onClick}>
			{children}
		</div>
	);
};

OverlayLayer.displayName = 'OverlayLayer';
