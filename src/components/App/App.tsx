import React from 'react';
import Modal from 'react-modal';
import { useSelector } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RootState } from 'state/reducers';
import { AppInitializer } from './AppInitializer'
import { AuthProvider, Footer, Header, Login, ShowGallery, UploadImage } from 'components';
import './App.css';

export const App: React.FC = () => {
	Modal.setAppElement('#root');
	const basename = process.env.PUBLIC_URL || '/';
	const uid = useSelector((state: RootState) => state.auth.uid); // Get the UID from Redux

	return (
		<AppInitializer>
			<AuthProvider>
				<Router basename={basename}>
					<div className="App">
						<Header />
						<main className="App-main">
							<Routes>
								<Route path="/" element={<ShowGallery />} />
								<Route path="/upload" element={<UploadImage />} />
								<Route path="/mygallery" element={<ShowGallery uid={uid} />} />
								<Route path="/login" element={<Login />} />
							</Routes>
						</main>
						<Footer />
					</div>
				</Router>
			</AuthProvider>
		</AppInitializer>
	);
};

App.displayName = 'App';
