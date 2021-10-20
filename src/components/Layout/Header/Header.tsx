import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

export const Header: React.FC = () => {
	return (
		<header className="App-header">
			<ul className="menuList">
				<li className="menuItem">
					<Link className="menuLink" to="/">{'Gallery'}</Link>
				</li>
				<li className="menuItem">
					<Link className="menuLink" to="/upload">Upload</Link>
				</li>
			</ul>

			<div className="siteBranding">Photogram</div>
		</header>
	);
};

Header.displayName = 'Header';
