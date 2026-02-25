import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBa006o6OBOXNMrJldG7FPa4TbM9GwN46M",
  authDomain: "mkienterprise.firebaseapp.com",
  databaseURL: "https://mkienterprise-default-rtdb.firebaseio.com",
  projectId: "mkienterprise",
  storageBucket: "mkienterprise.firebasestorage.app",
  messagingSenderId: "973675247017",
  appId: "1:973675247017:web:3688020a7eac993f3140b8",
  measurementId: "G-ZTE7PPHPDD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const analytics = getAnalytics(app);
