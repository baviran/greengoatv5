import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndUser } from '@/lib/auth-middleware';
import { DecodedIdToken } from 'firebase-admin/auth';
import { User } from '@/app/types/user';
import { firestoreAdmin } from '@/lib/firebase-admin';

/**
 * POST /api/admin/migrate-users - Migrate users to email-based document IDs (admin only)
 */
const authenticatedPOST = withAuthAndUser(async (request: NextRequest, firebaseUser: DecodedIdToken, firestoreUser: User) => {
  try {
    // Check admin permissions
    if (firestoreUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    console.log(`🚀 Admin ${firestoreUser.email} starting user migration to email-based document IDs...`);

    const usersCollection = firestoreAdmin.collection('users');
    
    // Get all existing users
    const snapshot = await usersCollection.get();
    
    if (snapshot.empty) {
      return NextResponse.json({
        message: 'No users to migrate',
        migrated: 0,
        skipped: 0
      });
    }

    const batch = firestoreAdmin.batch();
    const usersToMigrate: Array<{oldDocId: string, email: string, role: string}> = [];
    const skippedUsers: string[] = [];

    // Collect all users that need migration
    snapshot.docs.forEach(doc => {
      const userData = doc.data();
      const docId = doc.id;
      
      // Check if this document already uses email as ID
      if (docId === userData.email) {
        console.log(`⏭️ Skipping ${userData.email} - already migrated`);
        skippedUsers.push(userData.email);
        return;
      }
      
      usersToMigrate.push({
        oldDocId: docId,
        email: userData.email,
        role: userData.role
      });
    });

    if (usersToMigrate.length === 0) {
      return NextResponse.json({
        message: 'All users already migrated',
        migrated: 0,
        skipped: skippedUsers.length,
        skippedUsers
      });
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

    const result = {
      message: 'Migration completed successfully!',
      migrated: usersToMigrate.length,
      skipped: skippedUsers.length,
      migratedUsers: usersToMigrate.map(u => ({ email: u.email, role: u.role })),
      skippedUsers
    };

    console.log('🎉 Migration completed successfully!');
    console.log(`📊 Summary: Migrated ${usersToMigrate.length} users, Skipped ${skippedUsers.length} users`);

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
});

export { authenticatedPOST as POST }; 