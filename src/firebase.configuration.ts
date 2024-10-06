import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';

export const firebaseConfig = {
    apiKey: 'AIzaSyD3C9y6Z5NJKPkZ_-0wn0srSzLjQ1MeZuQ',
    authDomain: 'photograma-c2078.firebaseapp.com',
    databaseURL: 'https://reactblogmd.firebaseio.com',
    projectId: 'photograma-c2078',
    storageBucket: 'photograma-c2078.appspot.com',
    messagingSenderId: '169824492279',
    appId: '1:169824492279:web:186aa32b5777f06edd51f2',
};

export const firebaseStorageUrl = 'gs://photograma-c2078.appspot.com';

export const imagesDbCollection = 'imagesArray';

export const usersDbCollection = 'usersArray';

let app;
if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
} else {
    app = firebase.app(); // If already initialized, use that one
}

const auth = firebase.auth();
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
        console.log('Firebase persistence set to LOCAL');
    })
    .catch((error) => {
        console.error('Error setting Firebase persistence:', error);
    });

// Initialize Firebase Firestore
const db = firebase.firestore(app);

export { auth, db };

// Replace Firebase Storage upload with backend API upload
export const uploadImageToBackend = async (file: any) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('/api/upload', {  // Assume your server is at /api/upload
            method: 'POST',
            body: formData,
        });
        const data = await response.json();
        return data;  // Return response from server (e.g., image URL)
    } catch (error) {
        console.error('Error uploading image:', error);
    }
};