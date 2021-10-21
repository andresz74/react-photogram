import React from 'react';
import firebase from 'firebase/app';
import { AuthContext } from './AuthContext';
import { auth } from 'firebase.configuration';

export const AuthProvider: React.FC = ({ children }) => {
	const [user, setUser] = React.useState<firebase.User | null>(null);

	React.useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged(firebaseUser => {
			setUser(firebaseUser);
		});

		return unsubscribe;
	}, []);

	return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
};
