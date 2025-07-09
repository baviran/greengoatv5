// lib/firebase-admin.ts
import admin from 'firebase-admin';
import { Logger } from '../app/lib/utils/logger';

const logger = Logger.getInstance();

// Check if the app is already initialized to prevent errors during hot-reloading
if (!admin.apps.length) {
  let credential;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // Production environment (Firebase App Hosting) or local with service account key
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      credential = admin.credential.cert(serviceAccount);
      logger.info('Firebase Admin initialized with service account key', {
        component: 'firebase-admin',
        action: 'initialize',
        metadata: { credentialType: 'service-account' }
      });
    } catch (error) {
      logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY', error, {
        component: 'firebase-admin',
        action: 'initialize'
      });
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY format');
    }
  } else if (process.env.NODE_ENV === 'production') {
    // Production fallback to application default credentials
    credential = admin.credential.applicationDefault();
    logger.info('Firebase Admin initialized with application default credentials', {
      component: 'firebase-admin',
      action: 'initialize',
      metadata: { credentialType: 'application-default' }
    });
  } else {
    // Local development without service account key
    logger.warn('FIREBASE_SERVICE_ACCOUNT_KEY not found for local development', {
      component: 'firebase-admin',
      action: 'initialize'
    });
    logger.info('Attempting to use application default credentials', {
      component: 'firebase-admin',
      action: 'initialize',
      metadata: { credentialType: 'application-default-fallback' }
    });
    credential = admin.credential.applicationDefault();
  }

  admin.initializeApp({
    credential,
  });
}

const firestoreAdmin = admin.firestore();
const authAdmin = admin.auth();

export { firestoreAdmin, authAdmin };