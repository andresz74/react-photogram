import React from 'react';
import { useSelector } from 'react-redux';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { RootState } from 'state/reducers';
import { AppInitializer } from './AppInitializer'
import { AuthProvider, Footer, Header, Login, ShowGallery, UploadImage } from 'components';
import './App.css';

export const App: React.FC = () => {
	const basename = process.env.NODE_ENV === 'production' ? '/photogram' : '/';
	const uid = useSelector((state: RootState) => state.auth.uid); // Get the UID from Redux

	return (
		<AppInitializer>
			<AuthProvider>
				<Router basename={basename}>
					<div className="App">
						<Header />
						<main className="App-main">
							<Route exact path="/" render={() => <ShowGallery />} />
							<Route exact path="/upload" component={UploadImage} />
							<Route exact path="/mygallery" render={() => <ShowGallery uid={uid} />} />
							<Route exact path="/login" component={Login} />
						</main>
						<Footer />
					</div>
				</Router>
			</AuthProvider>
		</AppInitializer>
	);
};

App.displayName = 'App';
