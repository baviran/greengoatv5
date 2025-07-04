// lib/firebase-admin.ts
import admin from 'firebase-admin';

// Check if the app is already initialized to prevent errors during hot-reloading
if (!admin.apps.length) {
  let credential;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // Production environment (Firebase App Hosting) or local with service account key
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      credential = admin.credential.cert(serviceAccount);
      console.log('🔧 Firebase Admin initialized with service account key');
    } catch (error) {
      console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error);
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY format');
    }
  } else if (process.env.NODE_ENV === 'production') {
    // Production fallback to application default credentials
    credential = admin.credential.applicationDefault();
    console.log('🔧 Firebase Admin initialized with application default credentials');
  } else {
    // Local development without service account key
    console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_KEY not found for local development');
    console.warn('🔧 Attempting to use application default credentials');
    credential = admin.credential.applicationDefault();
  }

  admin.initializeApp({
    credential,
  });
}

const firestoreAdmin = admin.firestore();
const authAdmin = admin.auth();

export { firestoreAdmin, authAdmin };