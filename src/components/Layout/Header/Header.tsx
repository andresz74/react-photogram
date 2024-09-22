import React from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useIdleTimer } from 'react-idle-timer';
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
	const handleOnIdle = (event: Event) => {
		console.log('user is idle', event);
		console.log('last active', getLastActiveTime());
		signOut();
	};

	const handleOnActive = (event: Event) => {
		console.log('user is active', event);
		console.log('time remaining', getRemainingTime());
	};

	const handleOnAction = (event: Event) => {
		console.log('user did something', event);
	};

	const { getRemainingTime, getLastActiveTime } = useIdleTimer({
		timeout: 1000 * 60 * 15,
		onIdle: handleOnIdle,
		onActive: handleOnActive,
		onAction: handleOnAction,
		debounce: 500,
	});

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
					<li className="menuItem">
						<Link className="menuLink" to="/mygallery">
							{'My Gallery'}
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
