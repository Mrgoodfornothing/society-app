import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// PASTE YOUR CONFIG OBJECT HERE (Replace the X's with your real keys)
const firebaseConfig = {
  apiKey: "AIzaSyCojp5QnU3CWOi1PnhR49LQYpvESuvCOuw",
  authDomain: "societyapp-7e498.firebaseapp.com",
  projectId: "societyapp-7e498",
  storageBucket: "societyapp-7e498.firebasestorage.app",
  messagingSenderId: "668081681538",
  appId: "1:668081681538:web:42e68054bfab34faaf709b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };