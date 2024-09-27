import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { auth } from 'firebase.configuration'; // Firebase auth instance
import { actionCreators } from 'state'; // Redux actions for setting UID
import firebase from 'firebase/app'; // Import Firebase

export const AppInitializer: React.FC = ({ children }) => {
    const dispatch = useDispatch();

    useEffect(() => {
        // Set Firebase auth persistence to LOCAL
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .then(() => {
                console.log('Firebase persistence set to LOCAL');
            })
            .catch((error) => {
                console.error('Error setting Firebase persistence:', error);
            });

        // Listen for Firebase auth state changes
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                console.log("Firebase user on refresh:", user.uid);  // Log the user UID
                dispatch(actionCreators.setUserUID(user.uid));  // Dispatch UID to Redux
            } else {
                console.log("No user found after refresh");
                dispatch(actionCreators.setUserUID(null));  // Set UID to null if no user
            }
        });

        // Cleanup the listener on unmount
        return () => unsubscribe();
    }, [dispatch]);

    return <>{children}</>;
};
