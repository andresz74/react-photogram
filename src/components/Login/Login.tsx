import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getUserData } from 'api';
import { RootState } from 'state/reducers';
import { auth } from 'firebase.configuration';
import { actionCreators } from 'state';
import type { AppDispatch } from 'state';
import './Login.css';

export const Login: React.FC = () => {
	const uid = useSelector((state: RootState) => state.auth.uid);
	const emailRef = React.useRef<HTMLInputElement>(null);
	const passwordRef = React.useRef<HTMLInputElement>(null);
	const navigate = useNavigate();
	const dispatch = useDispatch<AppDispatch>();

	React.useEffect(() => {
		if (uid) navigate('/');
	}, [uid, navigate]);

	// Function to handle login and dispatch user UID
	const LogIn = async () => {
		try {
			const userCredential = await auth.signInWithEmailAndPassword(emailRef.current!.value, passwordRef.current!.value);
			if (userCredential) {
				const userUID = userCredential.user?.uid;
				// Store the UID in Redux
				if (userUID) {
					dispatch(actionCreators.setUserUID(userUID));
					getUserData(userUID);
				}
			}
			navigate('/');
		} catch (error) {
			console.error(error);
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
					<button onClick={LogIn}>Login</button>
				</div>
			</div>
		</>
	);
};

Login.displayName = 'Login';
