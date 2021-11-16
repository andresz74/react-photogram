import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { AuthContext } from 'components';
import { auth } from 'firebase.configuration';
import { RootState } from 'state/reducers';
import { UserInterface } from 'type';
import { actionCreators } from 'state';

export const Login: React.FC = () => {
	const user = React.useContext(AuthContext);
	const emailRef = React.useRef<HTMLInputElement>(null);
	const passwordRef = React.useRef<HTMLInputElement>(null);
	const history = useHistory();

	const usersData: UserInterface[] = useSelector((state: RootState) => state.users);
	const dispatch = useDispatch();

	const LogIn = async () => {
		try {
			await auth.signInWithEmailAndPassword(emailRef.current!.value, passwordRef.current!.value);
			dispatch(actionCreators.loadUsers());
			history.push('/');
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<>
			{!user && (
				<>
					<div>
						Email
						<input ref={emailRef} type="email" placeholder="email" />
					</div>
					<div>
						Password
						<input ref={passwordRef} type="password" name="" id="" />
					</div>
					<div>
						<button onClick={LogIn}>Login</button>
					</div>
				</>
			)}
		</>
	);
};

Login.displayName = 'Login';
