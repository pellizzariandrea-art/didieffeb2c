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

    // Check if using separate environment variables (simpler for Vercel)
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      console.log('🔑 Loading Firebase Admin SDK from separate environment variables');
      serviceAccount = {
        type: 'service_account',
        project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
      };
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
