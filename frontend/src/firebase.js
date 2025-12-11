import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  // ... Your existing config keys ...
  // (Keep the keys you pasted earlier!)
  apiKey: "AIzaSy...", 
  authDomain: "societyapp-xyz.firebaseapp.com",
  projectId: "societyapp-...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// --- ADD THIS LINE TO FORCE ACCOUNT PICKER ---
provider.setCustomParameters({ prompt: 'select_account' });

export { auth, provider };