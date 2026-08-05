import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/**
 * On Firebase Hosting (.web.app / .firebaseapp.com), authDomain must match the
 * page origin so the auth helper can use same-origin storage. Otherwise Google
 * sign-in appears to succeed and then drops you back on the login screen.
 *
 * For .web.app this also requires adding
 *   https://shakha-machine.web.app/__/auth/handler
 * as an Authorized redirect URI on the Google OAuth web client.
 */
function resolveAuthDomain() {
  const configured = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "shakha-machine.web.app" || host === "shakha-machine.firebaseapp.com") {
      return host;
    }
  }
  return configured;
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: resolveAuthDomain(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId
);

export const app: FirebaseApp | null = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;
export const googleProvider = new GoogleAuthProvider();
