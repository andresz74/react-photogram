import { db, usersDbCollection } from 'firebase.configuration';
// import { UserInterface } from 'type';

const usersRef = db.collection(usersDbCollection);

export const getUserData = async (userId: string | undefined) => {
	const snapshot = await usersRef.doc(userId);
	console.log(snapshot);
};
