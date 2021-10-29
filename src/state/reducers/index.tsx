import { combineReducers } from 'redux';
import imagesReducer from './imagesReducer';

const reducers = combineReducers({
	images: imagesReducer,
});

export default reducers;

export type RootState = ReturnType<typeof reducers>