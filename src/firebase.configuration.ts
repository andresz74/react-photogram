import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import { logger } from 'utils/logger';

// Firebase configuration object
export const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY!,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.REACT_APP_FIREBASE_APP_ID!,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID!,
};

// Firestore collections
export const imagesDbCollection = 'imagesArray';
export const usersDbCollection = 'usersArray';

// Initialize Firebase app
const app = !firebase.apps.length 
    ? firebase.initializeApp(firebaseConfig) 
    : firebase.app(); // Reuse existing instance

// Firebase authentication setup
export const auth = firebase.auth();
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => logger.debug('Firebase persistence set to LOCAL'))
    .catch((error) => logger.error('Error setting Firebase persistence:', error));

// Initialize Firestore
export const db = firebase.firestore(app);
