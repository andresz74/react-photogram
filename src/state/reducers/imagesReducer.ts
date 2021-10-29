import { ActionType } from '../actionTypes';
import { Action } from '../actions';
import { ImageInterface } from 'type';

const initialState: ImageInterface[] = [
	{
		imgArchived: false,
		imgId: '',
		imgName: 'picsum',
		imgSrc: 'https://picsum.photos/200',
		imgUploadDate: 0,
	},
	{
		imgArchived: false,
		imgId: '',
		imgName: 'picsum',
		imgSrc: 'https://picsum.photos/200',
		imgUploadDate: 0,
	},
	{
		imgArchived: false,
		imgId: '',
		imgName: 'picsum',
		imgSrc: 'https://picsum.photos/200',
		imgUploadDate: 0,
	},
];

const reducer = (state: ImageInterface[] = initialState, action: Action) => {
	switch (action.type) {
		case ActionType.LOAD_IMAGES:
			return action.imgList;
		case ActionType.LOAD_IMAGES_ERROR:
			return action.error;
		default:
			return state;
	}
};

export default reducer;
