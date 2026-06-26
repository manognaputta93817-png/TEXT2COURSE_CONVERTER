import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDZIA6bS-srNQbd8EzyKGncs5PscPFmKqA",
  authDomain: "text2course-89aaa.firebaseapp.com",
  projectId: "text2course-89aaa",
  storageBucket: "text2course-89aaa.firebasestorage.app",
  messagingSenderId: "346819282516",
  appId: "1:346819282516:web:06f22b1fadd7c1cdc98fc1",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
