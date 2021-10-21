import React from 'react';
import { Link, useHistory } from 'react-router-dom';
import { AuthContext } from 'components';
import { auth } from 'firebase.configuration';
import './Header.css';

export const Header: React.FC = () => {
	const user = React.useContext(AuthContext);
	const history = useHistory();

	const signOut = async () => {
		await auth.signOut();
		history.push('/');
	};

	return (
		<header className="App-header">
			<ul className="menuList">
				<li className="menuItem">
					<Link className="menuLink" to="/">
						{'Gallery'}
					</Link>
				</li>
				{user && (
					<li className="menuItem">
						<Link className="menuLink" to="/upload">
							Upload
						</Link>
					</li>
				)}
				{!user && (
					<li className="menuItem">
						<Link className="menuLink" to="/login">
							Login
						</Link>
					</li>
				)}
				{user && (
					<li className="menuItem itemClick" onClick={signOut}>
						Sign out
					</li>
				)}
			</ul>

			<div className="siteBranding">Photogram</div>
		</header>
	);
};

Header.displayName = 'Header';
