import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { Logger } from '@/app/lib/utils/logger';
import { firestoreAdmin } from '@/lib/firebase-admin';

/**
 * POST /api/admin/migrate-users - Migrate users to email-based document IDs (admin only)
 */
export const POST = withAuth(async (request: NextRequest, authResult) => {
  const { user, context } = authResult;
  
  // Type guard: user should always be defined when auth is successful
  if (!user) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
  
  const logger = Logger.getInstance().withContext({
    ...context,
    component: 'admin-migrate-users-api',
    action: 'migrate-users'
  });

  try {
    // Check admin permissions
    if (!user.isAdmin) {
      logger.warn('Non-admin user attempted to access migration endpoint');
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    logger.info('Admin starting user migration to email-based document IDs');

    const usersCollection = firestoreAdmin.collection('users');
    
    // Get all existing users
    const snapshot = await usersCollection.get();
    
    if (snapshot.empty) {
      logger.info('No users found to migrate');
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
        logger.debug('Skipping user - already migrated', undefined, {
          userEmail: userData.email,
          reason: 'already-migrated'
        });
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
      logger.info('All users already migrated', undefined, {
        totalUsers: snapshot.size,
        skippedCount: skippedUsers.length
      });
      return NextResponse.json({
        message: 'All users already migrated',
        migrated: 0,
        skipped: skippedUsers.length,
        skippedUsers
      });
    }

    logger.info('Found users to migrate', undefined, {
      totalUsers: snapshot.size,
      usersToMigrate: usersToMigrate.length,
      skippedUsers: skippedUsers.length
    });

    logger.debug('Users to migrate details', undefined, {
      usersToMigrate: usersToMigrate.map(u => `${u.email} (${u.role})`)
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
      
      logger.debug('Queued migration for user', undefined, {
        oldDocId: user.oldDocId,
        newDocId: user.email,
        role: user.role
      });
    }

    // Execute the batch
    logger.info('Executing migration batch', undefined, {
      batchOperations: usersToMigrate.length * 2 // create + delete for each user
    });
    await batch.commit();

    const result = {
      message: 'Migration completed successfully!',
      migrated: usersToMigrate.length,
      skipped: skippedUsers.length,
      migratedUsers: usersToMigrate.map(u => ({ email: u.email, role: u.role })),
      skippedUsers
    };

    logger.info('Migration completed successfully', undefined, {
      migratedCount: usersToMigrate.length,
      skippedCount: skippedUsers.length,
      totalProcessed: snapshot.size
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    logger.error('Migration failed', error, undefined, {
      operation: 'user-migration',
      stage: 'batch-execution'
    });
    
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}); 