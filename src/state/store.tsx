import { createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import thunk, { ThunkDispatch } from 'redux-thunk';
import reducers from './reducers';
import { AnyAction } from 'redux';

// Create store
export const store = createStore(reducers, {}, composeWithDevTools(applyMiddleware(thunk)));

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = ThunkDispatch<RootState, any, AnyAction>;
