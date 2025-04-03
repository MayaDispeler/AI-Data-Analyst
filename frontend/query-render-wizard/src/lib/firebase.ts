
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCNuZQF_3LCgGD_ol7B_GDRTEWHI8ZxkSc",
    authDomain: "kissflow-marketing-services.firebaseapp.com",
    databaseURL: "https://kissflow-marketing-services.firebaseio.com",
    projectId: "kissflow-marketing-services",
    storageBucket: "kissflow-marketing-services.firebasestorage.app",
    messagingSenderId: "415232018435",
    appId: "1:415232018435:web:85563f57465dc8b4216636"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore
export const db = getFirestore(app);

// Add scopes for Google OAuth
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');