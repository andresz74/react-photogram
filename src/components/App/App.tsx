import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

// import { auth } from 'firebase.configuration';
import { Footer, Header, Login, ShowGallery, UploadImage } from 'components';
import './App.css';

export const App: React.FC = () => {
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
