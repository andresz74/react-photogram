import { ActionType } from '../actionTypes';
import { Action } from '../actions';
import { ImageInterface } from 'type';

const initialState: ImageInterface[] = [];

const imagesReducer = (state: ImageInterface[] = initialState, action: Action) => {
    switch (action.type) {
        case ActionType.LOAD_IMAGES:
            return action.imgList;
        case ActionType.CLEAR_IMAGES:
            return [];  // Reset state to initial empty array
        case ActionType.LOAD_IMAGES_ERROR:
            return state;  // Preserve last good state on error
        case ActionType.ARCHIVE_IMAGE:
        default:
            return state;
    }
};


export default imagesReducer;
