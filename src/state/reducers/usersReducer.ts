import { ActionType } from '../actionTypes';
import { Action } from '../actions';
import { UserInterface } from 'type';

const initialState: UserInterface[] = [];

const reducer = (state: UserInterface[] = initialState, action: Action) => {
    switch (action.type) {
        case ActionType.LOAD_USERS:
            return action.userList;
            default:
                return state;
    }
}

export default reducer;