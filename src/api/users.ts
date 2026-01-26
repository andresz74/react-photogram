import { db, usersDbCollection } from 'firebase.configuration';
import type { UserInterface } from 'type';

const usersRef = db.collection(usersDbCollection);

export const getUserData = async (userId: string | undefined): Promise<UserInterface | null> => {
	if (!userId) return null;

	const snapshot = await usersRef.doc(userId).get();
	if (!snapshot.exists) return null;

	return snapshot.data() as UserInterface;
};
