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
      // Clean up the service account key - remove any extra whitespace or newlines
      const cleanedKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
      const serviceAccount = JSON.parse(cleanedKey);
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
      }, {
        keyLength: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.length,
        keyPreview: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.substring(0, 50) + '...'
      });
      
      // During build time, don't throw error - use application default credentials
      if (process.env.NODE_ENV === 'production' && !process.env.RUNTIME_ENV) {
        logger.warn('Using application default credentials during build', {
          component: 'firebase-admin',
          action: 'initialize'
        });
        credential = admin.credential.applicationDefault();
      } else {
        throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY format');
      }
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