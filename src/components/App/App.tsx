import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { AppInitializer } from './AppInitializer'

// import { auth } from 'firebase.configuration';
import { Footer, Header, Login, ShowGallery, UploadImage, UserGallery } from 'components';
import './App.css';

export const App: React.FC = () => {
	const basename = process.env.NODE_ENV === 'production' ? '/photogram' : '/';
	
	return (
		<AppInitializer>
			<Router basename={basename}>
				<div className="App">
					<Header />
					<main className="App-main">
						<Route exact path="/" render={() => <ShowGallery />} />
						<Route path="/upload" component={UploadImage} />
						<Route path="/mygallery" component={UserGallery} />
						<Route path="/login" component={Login} />
					</main>
					<Footer />
				</div>
			</Router>
		</AppInitializer>
	);
};

App.displayName = 'App';
