import React from 'react';
import { BrowserRouter as Router, Route, useHistory } from 'react-router-dom';
import { Footer, Header, Login, ShowGallery, UploadImage } from 'components';
import { auth } from 'firebase.configuration';
import { IdleTimer } from 'utillity';

import './App.css';

export const App: React.FC = () => {
	const [isTimeout, setIsTimeout] = React.useState(false);
	// const history = useHistory();

	const signOut = async () => {
		await auth.signOut();
		// history.push('/');
	};

	React.useEffect(() => {
		const timer = new IdleTimer({
			timeout: 10, //expire after 10 seconds
			onTimeout: () => {
				setIsTimeout(true);
			},
			onExpired: () => {
				//do something if expired on load
				setIsTimeout(true);
			},
		});

		return () => {
			timer.cleanUp();
		};
	}, []);

	React.useEffect(() => {
		if (isTimeout) {
			signOut();
		}
	}, [isTimeout]);

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
