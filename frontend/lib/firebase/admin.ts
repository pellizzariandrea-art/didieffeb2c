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
    // Read service account from file
    const serviceAccountPath = path.join(
      process.cwd(),
      '..',
      'admin',
      'didieffeb2b-ecommerce-firebase-adminsdk-fbsvc-fbd636cc08.json'
    );

    console.log('🔑 Loading Firebase Admin SDK service account from:', serviceAccountPath);

    const serviceAccountJSON = fs.readFileSync(serviceAccountPath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountJSON);

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
