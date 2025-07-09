import { firestoreAdmin } from '@/lib/firebase-admin';
import { User, CreateUserData, UpdateUserData, UserValidationResult } from '@/app/types/user';
import { Logger } from '@/app/lib/utils/logger';

export class UserService {
  private collection = firestoreAdmin.collection('users');
  private logger = Logger.getInstance().withContext({
    component: 'user-service'
  });

  /**
   * Check if a user exists by email (backward compatible)
   */
  async existsByEmail(email: string): Promise<boolean> {
    try {
      this.logger.debug('Checking if user exists by email', undefined, {
        email: email
      });
      
      // First try the new structure (email as document ID)
      const newDoc = await this.collection.doc(email).get();
      if (newDoc.exists) {
        this.logger.debug('User found in new structure', undefined, {
          email: email,
          structure: 'email-as-id'
        });
        return true;
      }
      
      // If not found, try the old structure (email as field)
      const oldSnapshot = await this.collection.where('email', '==', email).limit(1).get();
      const exists = !oldSnapshot.empty;
      
      this.logger.debug('User existence check completed', undefined, {
        email: email,
        exists: exists,
        structure: exists ? 'email-as-field' : 'not-found'
      });
      
      return exists;
    } catch (error) {
      this.logger.error('Error checking user existence by email', error, undefined, {
        email: email
      });
      return false;
    }
  }

  /**
   * Get user by email (backward compatible with old structure)
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      this.logger.debug('Getting user by email', undefined, {
        email: email
      });
      
      // First try the new structure (email as document ID)
      const newDoc = await this.collection.doc(email).get();
      if (newDoc.exists) {
        const userData = newDoc.data() as User;
        this.logger.debug('User found in new structure', undefined, {
          email: email,
          role: userData.role,
          structure: 'email-as-id'
        });
        return userData;
      }
      
      // If not found, try the old structure (email as field)
      const oldSnapshot = await this.collection.where('email', '==', email).limit(1).get();
      if (!oldSnapshot.empty) {
        const oldDoc = oldSnapshot.docs[0];
        const userData = oldDoc.data() as User;
        this.logger.debug('User found in old structure', undefined, {
          email: email,
          role: userData.role,
          structure: 'email-as-field'
        });
        return userData;
      }
      
      this.logger.debug('User not found', undefined, {
        email: email
      });
      return null;
    } catch (error) {
      this.logger.error('Error getting user by email', error, undefined, {
        email: email
      });
      return null;
    }
  }

  /**
   * Get user by email (alias for getUserByEmail for backward compatibility)
   */
  async getUser(email: string): Promise<User | null> {
    return this.getUserByEmail(email);
  }

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      this.logger.info('Creating new user', undefined, {
        email: userData.email,
        role: userData.role || 'user'
      });
      
      const newUser: User = {
        email: userData.email,
        role: userData.role || 'user'
      };

      // Use email as document ID
      await this.collection.doc(userData.email).set(newUser);
      
      this.logger.info('User created successfully', undefined, {
        email: userData.email,
        role: newUser.role
      });
      
      return newUser;
    } catch (error) {
      this.logger.error('Error creating user', error, undefined, {
        email: userData.email,
        role: userData.role || 'user'
      });
      throw new Error('Failed to create user');
    }
  }

  /**
   * Update user data
   */
  async updateUser(email: string, updateData: UpdateUserData): Promise<User | null> {
    try {
      this.logger.info('Updating user', undefined, {
        email: email,
        updateFields: Object.keys(updateData)
      });
      
      await this.collection.doc(email).update(updateData as any);
      
      const updatedUser = await this.getUserByEmail(email);
      
      this.logger.info('User updated successfully', undefined, {
        email: email,
        role: updatedUser?.role
      });
      
      return updatedUser;
    } catch (error) {
      this.logger.error('Error updating user', error, undefined, {
        email: email,
        updateFields: Object.keys(updateData)
      });
      throw new Error('Failed to update user');
    }
  }

  /**
   * Delete user
   */
  async deleteUser(email: string): Promise<void> {
    try {
      this.logger.info('Deleting user', undefined, {
        email: email
      });
      
      await this.collection.doc(email).delete();
      
      this.logger.info('User deleted successfully', undefined, {
        email: email
      });
    } catch (error) {
      this.logger.error('Error deleting user', error, undefined, {
        email: email
      });
      throw new Error('Failed to delete user');
    }
  }

  /**
   * Check if user is admin
   */
  async isAdmin(email: string): Promise<boolean> {
    try {
      this.logger.debug('Checking admin status', undefined, {
        email: email
      });
      
      const user = await this.getUserByEmail(email);
      const isAdmin = user?.role === 'admin';
      
      this.logger.debug('Admin status checked', undefined, {
        email: email,
        isAdmin: isAdmin
      });
      
      return isAdmin;
    } catch (error) {
      this.logger.error('Error checking admin status', error, undefined, {
        email: email
      });
      return false;
    }
  }

  /**
   * Get all users (admin only) - handles both old and new structures
   */
  async getAllUsers(): Promise<User[]> {
    try {
      this.logger.info('Getting all users');
      
      const snapshot = await this.collection.get();
      const users: User[] = [];
      const processedEmails = new Set<string>();
      
      snapshot.docs.forEach(doc => {
        const userData = doc.data() as User;
        
        // Skip if we've already processed this email (prevents duplicates during migration)
        if (processedEmails.has(userData.email)) {
          return;
        }
        
        processedEmails.add(userData.email);
        users.push(userData);
      });
      
      // Sort by email
      const sortedUsers = users.sort((a, b) => a.email.localeCompare(b.email));
      
      this.logger.info('Successfully retrieved all users', undefined, {
        totalUsers: sortedUsers.length,
        adminUsers: sortedUsers.filter(u => u.role === 'admin').length
      });
      
      return sortedUsers;
    } catch (error) {
      this.logger.error('Error getting all users', error);
      throw new Error('Failed to get users');
    }
  }

  /**
   * Get users count
   */
  async getUsersCount(): Promise<number> {
    try {
      this.logger.debug('Getting users count');
      
      const snapshot = await this.collection.get();
      const count = snapshot.size;
      
      this.logger.debug('Users count retrieved', undefined, {
        count: count
      });
      
      return count;
    } catch (error) {
      this.logger.error('Error getting users count', error);
      return 0;
    }
  }

  /**
   * Validate user access (main authorization check)
   */
  async validateUserAccess(email: string): Promise<UserValidationResult> {
    try {
      this.logger.debug('Validating user access', undefined, {
        email: email
      });
      
      const user = await this.getUserByEmail(email);
      
      if (!user) {
        this.logger.warn('User access validation failed - user not found', undefined, {
          email: email
        });
        return {
          isValid: false,
          error: 'User not found'
        };
      }

      this.logger.debug('User access validated successfully', undefined, {
        email: email,
        role: user.role
      });

      return {
        isValid: true,
        user
      };
    } catch (error) {
      this.logger.error('Error validating user access', error, undefined, {
        email: email
      });
      return {
        isValid: false,
        error: 'Access validation failed'
      };
    }
  }
}

// Export singleton instance
export const userService = new UserService(); 