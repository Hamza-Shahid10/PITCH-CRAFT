import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA8BOukqMk2PQeRPKWGxCU-sOnmmGIO1as",
  authDomain: "smitchaman.firebaseapp.com",
  projectId: "smitchaman",
  storageBucket: "smitchaman.firebasestorage.app",
  messagingSenderId: "268285812047",
  appId: "1:268285812047:web:af5f6fb10227a93ed2793a",
  measurementId: "G-6DMQD8TCWF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
