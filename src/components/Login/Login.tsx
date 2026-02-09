import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getUserData } from 'api';
import { RootState } from 'state/reducers';
import { auth } from 'firebase.configuration';
import { actionCreators } from 'state';
import type { AppDispatch } from 'state';
import { logger } from 'utils/logger';
import './Login.css';

export const Login: React.FC = () => {
	const uid = useSelector((state: RootState) => state.auth.uid);
	const authRequest = useSelector((state: RootState) => state.requestStatus.auth);
	const emailRef = React.useRef<HTMLInputElement>(null);
	const passwordRef = React.useRef<HTMLInputElement>(null);
	const navigate = useNavigate();
	const dispatch = useDispatch<AppDispatch>();

	React.useEffect(() => {
		if (uid) navigate('/');
	}, [uid, navigate]);

	// Function to handle login and dispatch user UID
	const logIn = async () => {
		const email = emailRef.current?.value?.trim() ?? '';
		const password = passwordRef.current?.value ?? '';

		if (!email || !password) {
			dispatch(actionCreators.setAsyncStatus('auth', 'failed', 'Please provide email and password.'));
			return;
		}

		dispatch(actionCreators.setAsyncStatus('auth', 'loading'));

		try {
			const userCredential = await auth.signInWithEmailAndPassword(email, password);
			if (userCredential) {
				const userUID = userCredential.user?.uid;
				if (userUID) {
					dispatch(actionCreators.setUserUID(userUID));
					await getUserData(userUID);
				}
			}
			dispatch(actionCreators.setAsyncStatus('auth', 'succeeded'));
			navigate('/');
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			logger.error('Login failed:', error);
			dispatch(actionCreators.setAsyncStatus('auth', 'failed', message));
		}
	};

	return (
		<>
			<div className="loginForm">
				<div className="loginFormInput">
					<input ref={emailRef} type="email" placeholder="Email" />
				</div>
				<div className="loginFormInput">
					<input ref={passwordRef} type="password" name="" id="" placeholder="Password" />
				</div>
				<div className="loginFormButton">
					<button onClick={logIn} disabled={authRequest.status === 'loading'}>
						{authRequest.status === 'loading' ? 'Logging in...' : 'Login'}
					</button>
				</div>
				{authRequest.status === 'failed' && authRequest.error && (
					<div className="loginError" role="alert">
						{authRequest.error}
					</div>
				)}
			</div>
		</>
	);
};

Login.displayName = 'Login';
