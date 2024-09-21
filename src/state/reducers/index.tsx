import { combineReducers } from 'redux';
import imagesReducer from './imagesReducer';
import authReducer from './authReducer';

const reducers = combineReducers({
	images: imagesReducer,
	auth: authReducer,
});

export default reducers;

export type RootState = ReturnType<typeof reducers>