import { ActionType } from '../actionTypes';
import { Action } from '../actions';
import { ImageInterface } from 'type';

const initialState: ImageInterface[] = [];

const userImagesReducer = (state: ImageInterface[] = initialState, action: Action) => {
    switch (action.type) {
        case ActionType.LOAD_USER_IMAGES:
            return action.imgUserList;
        case ActionType.CLEAR_IMAGES:
            return [];  // Reset state to initial empty array
        case ActionType.ARCHIVE_IMAGE:
        default:
            return state;
    }
};


export default userImagesReducer;
