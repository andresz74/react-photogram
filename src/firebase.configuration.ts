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
}

// Initialize Firebase Firestore
const db = firebase.firestore(app);

// Initialize Firebase Storage
const storage = firebase.storage();

const auth = firebase.auth();

export { auth, db, storage };
