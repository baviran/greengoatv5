// lib/firebase-admin.ts
import admin from 'firebase-admin';

// Check if the app is already initialized to prevent errors during hot-reloading
if (!admin.apps.length) {
  admin.initializeApp({
    // These credentials will be automatically available in the App Hosting environment
    credential: admin.credential.applicationDefault(),
  });
}

const firestoreAdmin = admin.firestore();
const authAdmin = admin.auth();

export { firestoreAdmin, authAdmin };