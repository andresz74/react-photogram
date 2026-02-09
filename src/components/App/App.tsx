import React from 'react';
import { useSelector } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RootState } from 'state/reducers';
import { AppInitializer } from './AppInitializer'
import { ProtectedRoute } from './ProtectedRoute';
import { Footer, Header, Login, ShowGallery, UploadImage } from 'components';
import './App.css';

export const App: React.FC = () => {
	const basename = process.env.PUBLIC_URL || '/';
	const uid = useSelector((state: RootState) => state.auth.uid); // Get the UID from Redux

	return (
		<AppInitializer>
			<Router basename={basename}>
				<div className="App">
					<Header />
					<main className="App-main">
						<Routes>
							<Route path="/" element={<ShowGallery />} />
							<Route
								path="/upload"
								element={
									<ProtectedRoute isAuthenticated={Boolean(uid)}>
										<UploadImage />
									</ProtectedRoute>
								}
							/>
							<Route
								path="/mygallery"
								element={
									<ProtectedRoute isAuthenticated={Boolean(uid)}>
										<ShowGallery uid={uid} />
									</ProtectedRoute>
								}
							/>
							<Route path="/login" element={<Login />} />
						</Routes>
					</main>
					<Footer />
				</div>
			</Router>
		</AppInitializer>
	);
};

App.displayName = 'App';
