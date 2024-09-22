import React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { getUserData } from 'api';
import { AuthContext } from 'components';
import { auth } from 'firebase.configuration';
import { actionCreators } from 'state';
import './Login.css';

export const Login: React.FC = () => {
	const user = React.useContext(AuthContext);
	const emailRef = React.useRef<HTMLInputElement>(null);
	const passwordRef = React.useRef<HTMLInputElement>(null);
	const history = useHistory();
	const dispatch = useDispatch();

	// Function to handle login and dispatch user UID
	const LogIn = async () => {
		try {
			const userCredential = await auth.signInWithEmailAndPassword(emailRef.current!.value, passwordRef.current!.value);
			if (userCredential) {
				const userUID = userCredential.user?.uid;
				// Store the UID in Redux
				if (userUID) {
					console.log(userUID);
					dispatch(actionCreators.setUserUID(userUID));
					getUserData(userUID);
				}
			}
			history.push('/');
		} catch (error) {
			console.error(error);
		}
	};

	// Listen for auth state changes to persist the auth state across page refreshes
	React.useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged((user) => {
			if (user) {
				// If user is already logged in, store their UID in Redux
				dispatch(actionCreators.setUserUID(user.uid));
			}
		});

		// Cleanup subscription on unmount
		return () => unsubscribe();
	}, [dispatch]);

	return (
		<>
			{!user && (
				<div className="loginForm">
					<div className="loginFormInput">
						<input ref={emailRef} type="email" placeholder="Email" />
					</div>
					<div className="loginFormInput">
						<input ref={passwordRef} type="password" name="" id="" placeholder="Password" />
					</div>
					<div className="loginFormButton">
						<button onClick={LogIn}>Login</button>
					</div>
				</div>
			)}
		</>
	);
};

Login.displayName = 'Login';
