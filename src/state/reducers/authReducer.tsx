import { ActionType } from '../actionTypes';
import { Action } from '../actions';

interface AuthState {
    uid: string | null;
}

const initialState: AuthState = {
    uid: null,
};

const authReducer = (state = initialState, action: Action): AuthState => {
    switch (action.type) {
        case ActionType.SET_USER_UID:
            return {
                ...state,
                uid: action.uid,
            };
        default:
            return state;
    }
};

export default authReducer;
