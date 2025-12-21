import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

// Firebase configuration object
export const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY!,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID!,
    messagingSenderId: '169824492279',
    appId: process.env.REACT_APP_FIREBASE_APP_ID!,
    measurementId: "G-2D2NQQF8YB"
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
    .then(() => console.log('Firebase persistence set to LOCAL'))
    .catch((error) => console.error('Error setting Firebase persistence:', error));

// Initialize Firestore
export const db = firebase.firestore(app);
