import { Action } from '../actions';
import { ActionType } from '../actionTypes';
import type { AsyncStatus } from '../actions';

export interface AsyncState {
	status: AsyncStatus;
	error: string | null;
}

export interface RequestStatusState {
	auth: AsyncState;
	publicGallery: AsyncState;
	userGallery: AsyncState;
	upload: AsyncState;
}

const defaultAsyncState: AsyncState = {
	status: 'idle',
	error: null,
};

const initialState: RequestStatusState = {
	auth: { ...defaultAsyncState },
	publicGallery: { ...defaultAsyncState },
	userGallery: { ...defaultAsyncState },
	upload: { ...defaultAsyncState },
};

const requestStatusReducer = (state: RequestStatusState = initialState, action: Action): RequestStatusState => {
	switch (action.type) {
		case ActionType.SET_ASYNC_STATUS: {
			return {
				...state,
				[action.feature]: {
					status: action.status,
					error: action.error,
				},
			};
		}
		default:
			return state;
	}
};

export default requestStatusReducer;
