import React from 'react';
import { useHistory } from 'react-router-dom';
import { getUserData } from 'api';
import { AuthContext } from 'components';
import { auth } from 'firebase.configuration';
import './Login.css';

export const Login: React.FC = () => {
	const user = React.useContext(AuthContext);
	const emailRef = React.useRef<HTMLInputElement>(null);
	const passwordRef = React.useRef<HTMLInputElement>(null);
	const history = useHistory();

	const LogIn = async () => {
		try {
			const userCredential = await auth.signInWithEmailAndPassword(emailRef.current!.value, passwordRef.current!.value);
			if (userCredential) {
				console.log(userCredential.user?.uid);
				getUserData(userCredential.user?.uid);
			}
			history.push('/');
		} catch (error) {
			console.error(error);
		}
	};

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
