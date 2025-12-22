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
            if (!action.imgId || typeof action.imgArchived !== 'boolean') return state;
            if (action.removeFromList) {
                return state.filter(img => img.imgId !== action.imgId);
            }
            return state.map(img => (img.imgId === action.imgId ? { ...img, imgArchived: action.imgArchived } : img));
        case ActionType.TOGGLE_PRIVATE_IMAGE:
            if (!action.imgId || typeof action.imgPrivate !== 'boolean') return state;
            return state.map(img => (img.imgId === action.imgId ? { ...img, imgPrivate: action.imgPrivate } : img));
        default:
            return state;
    }
};


export default imagesReducer;
