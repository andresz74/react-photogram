import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useIdleTimer } from 'react-idle-timer';
import { AuthContext } from 'components';
import { auth } from 'firebase.configuration';
import './Header.css';

export const Header: React.FC = () => {
	const user = React.useContext(AuthContext);
	const navigate = useNavigate();
	const [menuOpen, setMenuOpen] = React.useState<boolean>(false);

	const signOut = async () => {
		await auth.signOut();
		navigate('/');
		setMenuOpen(false);
	};

	const closeMenu = () => setMenuOpen(false);
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
			<div className="headerBar">
				<button
					type="button"
					className={`menuToggle ${menuOpen ? 'isOpen' : ''}`}
					aria-expanded={menuOpen}
					aria-label="Toggle navigation"
					onClick={() => setMenuOpen(open => !open)}
				>
					<span />
					<span />
					<span />
				</button>
			</div>
			<div
				className={`menuOverlay ${menuOpen ? 'isOpen' : ''}`}
				onClick={closeMenu}
				role="presentation"
			/>
			<ul className={`menuList ${menuOpen ? 'isOpen' : ''}`}>
				<li className="menuItem">
					<Link className="menuLink" to="/" onClick={closeMenu}>
						{'Gallery'}
					</Link>
				</li>
				{user && (
					<li className="menuItem">
						<Link className="menuLink" to="/upload" onClick={closeMenu}>
							Upload
						</Link>
					</li>
				)}
				{!user && (
					<li className="menuItem">
						<Link className="menuLink" to="/login" onClick={closeMenu}>
							Login
						</Link>
					</li>
				)}
				{user && (
					<li className="menuItem">
						<Link className="menuLink" to="/mygallery" onClick={closeMenu}>
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
