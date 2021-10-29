import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import './index.css';
import { App } from 'components';
import { AuthProvider } from 'components/Common';
import reportWebVitals from './reportWebVitals';
import { store } from './state';

ReactDOM.render(
	<React.StrictMode>
		<AuthProvider>
			<Provider store={store}>
				<App />
			</Provider>
		</AuthProvider>
	</React.StrictMode>,
	document.getElementById('root'),
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
