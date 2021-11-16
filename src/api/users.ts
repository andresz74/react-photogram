import { db, usersDbCollection } from 'firebase.configuration';
import { UserInterface } from 'type';

const usersRef = db.collection(usersDbCollection);

export const getUserList = async () => {
	const snapshot = await usersRef.get();
	const data: UserInterface[] = [];

	snapshot.forEach(doc => {
		data.push({
			userType: doc.data().userType,
			userID: doc.data().userID,
		});
	});

    return data;
};
