// lib/firebase/config.ts
// Firebase Configuration and Initialization

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (singleton pattern)
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (typeof window !== 'undefined') {
  // Client-side only
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  auth = getAuth(app);
  db = getFirestore(app);
}

// Export with type assertions for client-side usage
// These will only be used in 'use client' components
export { app, auth as authInstance, db as dbInstance };
export default firebaseConfig;

// Safe getters for auth and db
export const getAuthInstance = () => {
  if (typeof window === 'undefined') {
    throw new Error('Auth can only be used on the client side');
  }
  if (!auth) {
    throw new Error('Auth not initialized. Make sure Firebase config is loaded.');
  }
  return auth;
};

export const getDbInstance = () => {
  if (typeof window === 'undefined') {
    throw new Error('Firestore can only be used on the client side');
  }
  if (!db) {
    throw new Error('Firestore not initialized. Make sure Firebase config is loaded.');
  }
  return db;
};
