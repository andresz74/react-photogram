import { combineReducers } from 'redux';
import imagesReducer from './imagesReducer';
import userImagesReducer from'./userImagesReducer';
import authReducer from './authReducer';
import requestStatusReducer from './requestStatusReducer';

const reducers = combineReducers({
	images: imagesReducer,
	userImages: userImagesReducer,
	auth: authReducer,
	requestStatus: requestStatusReducer,
});

export default reducers;

export type RootState = ReturnType<typeof reducers>
