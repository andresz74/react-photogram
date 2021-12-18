import React from 'react';
import { BrowserRouter as Router, Route, useHistory } from 'react-router-dom';
import { useIdleTimer } from 'react-idle-timer';
import { auth } from 'firebase.configuration';
import { Footer, Header, Login, ShowGallery, UploadImage } from 'components';
import './App.css';

export const App: React.FC = () => {
	const history = useHistory();
	const signOut = async () => {
		await auth.signOut();
		console.log(history)
		// history.push('/');
	};
	const handleOnIdle = (event: any) => {
		console.log('user is idle', event);
		console.log('last active', getLastActiveTime());
		signOut();
	};

	const handleOnActive = (event: any) => {
		console.log('user is active', event);
		console.log('time remaining', getRemainingTime());
	};

	const handleOnAction = (event: any) => {
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
		<Router>
			<div className="App">
				<Header />
				<main className="App-main">
					<Route exact path="/" render={() => <ShowGallery />} />
					<Route path="/upload" component={UploadImage} />
					<Route path="/login" component={Login} />
				</main>
				<Footer />
			</div>
		</Router>
	);
};

App.displayName = 'App';
