import { combineReducers } from 'redux';
import imagesReducer from './imagesReducer';
import usersReducer from './usersReducer';

const reducers = combineReducers({
	images: imagesReducer,
	users: usersReducer,
});

export default reducers;

export type RootState = ReturnType<typeof reducers>