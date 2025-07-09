import { NextRequest } from 'next/server';
import { withApiResponse, createApiResponse, AuthResultWithContext } from '@/app/lib/utils/response-middleware';
import { ApiResponseBuilder, HTTP_STATUS } from '@/app/lib/utils/api-response';
import { Logger } from '@/app/lib/utils/logger';
import { firestoreAdmin } from '@/lib/firebase-admin';

/**
 * POST /api/admin/migrate-users - Migrate users to email-based document IDs (admin only)
 */
export const POST = withApiResponse('admin-migrate-users-api', 'migrate-users')(
  async (request: NextRequest, authResult: AuthResultWithContext) => {
    const { user, context } = authResult;
    const logger = Logger.getInstance();
    
    // Type guard: user should always be defined when auth is successful
    if (!user) {
      const errorResponse = ApiResponseBuilder.unauthorized('Authentication failed', context);
      return createApiResponse(errorResponse, HTTP_STATUS.UNAUTHORIZED);
    }

    try {
      // Check admin permissions
      if (!user.isAdmin) {
        logger.warn('Non-admin user attempted to access migration endpoint', context);
        const errorResponse = ApiResponseBuilder.forbidden('Admin access required', context);
        return createApiResponse(errorResponse, HTTP_STATUS.FORBIDDEN);
      }

      logger.info('Admin starting user migration to email-based document IDs', context);

      const usersCollection = firestoreAdmin.collection('users');
      
      // Get all existing users
      const snapshot = await usersCollection.get();
      
      if (snapshot.empty) {
        logger.info('No users found to migrate', context);
        const responseData = {
          message: 'No users to migrate',
          migrated: 0,
          skipped: 0
        };
        const successResponse = ApiResponseBuilder.success(responseData, context);
        return createApiResponse(successResponse, HTTP_STATUS.OK);
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
          logger.debug('Skipping user - already migrated', context, {
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
        logger.info('All users already migrated', context, {
          totalUsers: snapshot.size,
          skippedCount: skippedUsers.length
        });
        const responseData = {
          message: 'All users already migrated',
          migrated: 0,
          skipped: skippedUsers.length,
          skippedUsers
        };
        const successResponse = ApiResponseBuilder.success(responseData, context);
        return createApiResponse(successResponse, HTTP_STATUS.OK);
      }

      logger.info('Found users to migrate', context, {
        totalUsers: snapshot.size,
        usersToMigrate: usersToMigrate.length,
        skippedUsers: skippedUsers.length
      });

      logger.debug('Users to migrate details', context, {
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
        
        logger.debug('Queued migration for user', context, {
          oldDocId: user.oldDocId,
          newDocId: user.email,
          role: user.role
        });
      }

      // Execute the batch
      logger.info('Executing migration batch', context, {
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

      logger.info('Migration completed successfully', context, {
        migratedCount: usersToMigrate.length,
        skippedCount: skippedUsers.length,
        totalProcessed: snapshot.size
      });

      const successResponse = ApiResponseBuilder.success(result, context);
      return createApiResponse(successResponse, HTTP_STATUS.OK);

    } catch (error) {
      logger.error('Migration failed', error, context, {
        operation: 'user-migration',
        stage: 'batch-execution'
      });
      
      const errorResponse = ApiResponseBuilder.internalError('Migration failed', context);
      return createApiResponse(errorResponse, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
); 