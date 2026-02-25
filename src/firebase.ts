import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBa006o6OBOXNMrJldG7FPa4TbM9GwN46M",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mkienterprise.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://mkienterprise-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mkienterprise",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mkienterprise.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "973675247017",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:973675247017:web:3688020a7eac993f3140b8",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ZTE7PPHPDD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const analytics = getAnalytics(app);
