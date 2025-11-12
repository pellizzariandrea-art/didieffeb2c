// lib/firebase/admin.ts
// Firebase Admin SDK Configuration (Server-side only)

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

let adminApp: admin.app.App | undefined;

export const getAdminApp = () => {
  if (adminApp) {
    return adminApp;
  }

  // Check if already initialized
  if (admin.apps.length > 0) {
    adminApp = admin.apps[0] as admin.app.App;
    return adminApp;
  }

  // Initialize with service account
  try {
    let serviceAccount: any;

    // Try to get service account from environment variable (for Vercel/production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.log('🔑 Loading Firebase Admin SDK from environment variable');

      // Try to parse as base64 first, then fall back to direct JSON
      try {
        const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decoded);
        console.log('✅ Decoded from base64');
      } catch {
        // If base64 fails, try direct JSON parse
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        console.log('✅ Parsed directly as JSON');
      }
    } else {
      // Fallback to reading from file (for local development)
      const serviceAccountPath = path.join(
        process.cwd(),
        '..',
        'admin',
        'didieffeb2b-ecommerce-firebase-adminsdk-fbsvc-fbd636cc08.json'
      );

      console.log('🔑 Loading Firebase Admin SDK service account from:', serviceAccountPath);

      const serviceAccountJSON = fs.readFileSync(serviceAccountPath, 'utf8');
      serviceAccount = JSON.parse(serviceAccountJSON);
    }

    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return adminApp;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    throw new Error(`Firebase Admin SDK initialization failed: ${error}`);
  }
};

export const getAdminFirestore = () => {
  const app = getAdminApp();
  return app.firestore();
};

export const getAdminAuth = () => {
  const app = getAdminApp();
  return app.auth();
};
