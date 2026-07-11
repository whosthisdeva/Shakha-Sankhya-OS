// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBtF_RP1RlXAK_B7iR20Hfs2kkECc7V_do",
  authDomain: "dip-55e27.firebaseapp.com",
  projectId: "dip-55e27",
  storageBucket: "dip-55e27.firebasestorage.app",
  messagingSenderId: "470058503579",
  appId: "1:470058503579:web:4fc18bdacad9c5bd4f653e",
  measurementId: "G-DND1CTRZ64"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
