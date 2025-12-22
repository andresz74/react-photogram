import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { auth } from 'firebase.configuration'; // Firebase auth instance
import { actionCreators } from 'state'; // Redux actions for setting UID
import { logger } from 'utils/logger';

export const AppInitializer: React.FC = ({ children }) => {
    const dispatch = useDispatch<any>();

    useEffect(() => {
        // Listen for Firebase auth state changes
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                logger.debug('Firebase auth state:', user.uid);
                dispatch(actionCreators.setUserUID(user.uid));  // Dispatch UID to Redux
            } else {
                logger.debug('Firebase auth state: signed out');
                dispatch(actionCreators.setUserUID(null));  // Set UID to null if no user
            }
        });

        // Cleanup the listener on unmount
        return () => unsubscribe();
    }, [dispatch]);

    return <>{children}</>;
};
