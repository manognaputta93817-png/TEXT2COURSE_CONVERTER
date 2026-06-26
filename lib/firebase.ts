// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase config (replace with your actual keys from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyDZIA6bS-srNQbd8EzyKGncs5PscPFmKqA",
  authDomain: "text2course-89aaa.firebaseapp.com",
  projectId: "text2course-89aaa",
  storageBucket: "text2course-89aaa.appspot.com",
  messagingSenderId: "346819282516",
  appId: "1:346819282516:web:06f22b1fadd7c1cdc98fc1",
};

// Initialize Firebase only once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Export Auth and Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { app };
