const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  // You'll need to set up your service account key
  const serviceAccount = require(path.join(__dirname, '../path-to-your-service-account-key.json'));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // Add your project ID here
    projectId: 'your-project-id'
  });
}

const db = admin.firestore();

async function migrateUsersToEmailIds() {
  console.log('🚀 Starting user migration to email-based document IDs...');
  
  try {
    // Get all existing users
    const usersCollection = db.collection('users');
    const snapshot = await usersCollection.get();
    
    if (snapshot.empty) {
      console.log('✅ No users to migrate');
      return;
    }
    
    const batch = db.batch();
    const usersToMigrate = [];
    
    // Collect all users that need migration
    snapshot.docs.forEach(doc => {
      const userData = doc.data();
      const docId = doc.id;
      
      // Check if this document already uses email as ID
      if (docId === userData.email) {
        console.log(`⏭️ Skipping ${userData.email} - already migrated`);
        return;
      }
      
      usersToMigrate.push({
        oldDocId: docId,
        email: userData.email,
        role: userData.role
      });
    });
    
    if (usersToMigrate.length === 0) {
      console.log('✅ All users already migrated');
      return;
    }
    
    console.log(`📋 Found ${usersToMigrate.length} users to migrate:`);
    usersToMigrate.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });
    
    // Create new documents with email as ID and delete old ones
    for (const user of usersToMigrate) {
      // Create new document with email as ID
      const newDocRef = usersCollection.doc(user.email);
      batch.set(newDocRef, {
        email: user.email,
        role: user.role
      });
      
      // Delete old document
      const oldDocRef = usersCollection.doc(user.oldDocId);
      batch.delete(oldDocRef);
      
      console.log(`✅ Queued migration: ${user.oldDocId} → ${user.email}`);
    }
    
    // Execute the batch
    console.log('🔄 Executing migration batch...');
    await batch.commit();
    
    console.log('🎉 Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - Migrated ${usersToMigrate.length} users`);
    console.log('  - Database now uses email as document ID');
    console.log('  - Structure simplified to email + role only');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  migrateUsersToEmailIds()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateUsersToEmailIds }; 