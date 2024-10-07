import { combineReducers } from 'redux';
import imagesReducer from './imagesReducer';
import userImagesReducer from'./userImagesReducer';
import authReducer from './authReducer';

const reducers = combineReducers({
	images: imagesReducer,
	userImages: userImagesReducer,
	auth: authReducer,
});

export default reducers;

export type RootState = ReturnType<typeof reducers>