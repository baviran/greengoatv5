import { firestoreAdmin } from '@/lib/firebase-admin';
import { User, CreateUserData, UpdateUserData, UserValidationResult } from '@/app/types/user';

export class UserService {
  private collection = firestoreAdmin.collection('users');

  /**
   * Check if a user exists by email (backward compatible)
   */
  async existsByEmail(email: string): Promise<boolean> {
    try {
      // First try the new structure (email as document ID)
      const newDoc = await this.collection.doc(email).get();
      if (newDoc.exists) {
        return true;
      }
      
      // If not found, try the old structure (email as field)
      const oldSnapshot = await this.collection.where('email', '==', email).limit(1).get();
      return !oldSnapshot.empty;
    } catch (error) {
      console.error('Error checking user existence by email:', error);
      return false;
    }
  }

  /**
   * Get user by email (backward compatible with old structure)
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      // First try the new structure (email as document ID)
      const newDoc = await this.collection.doc(email).get();
      if (newDoc.exists) {
        const userData = newDoc.data() as User;
        return userData;
      }
      
      // If not found, try the old structure (email as field)
      const oldSnapshot = await this.collection.where('email', '==', email).limit(1).get();
      if (!oldSnapshot.empty) {
        const oldDoc = oldSnapshot.docs[0];
        const userData = oldDoc.data() as User;
        return userData;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user by email:', error);
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
      const newUser: User = {
        email: userData.email,
        role: userData.role || 'user'
      };

      // Use email as document ID
      await this.collection.doc(userData.email).set(newUser);
      
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  /**
   * Update user data
   */
  async updateUser(email: string, updateData: UpdateUserData): Promise<User | null> {
    try {
      await this.collection.doc(email).update(updateData as any);
      return await this.getUserByEmail(email);
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  /**
   * Delete user
   */
  async deleteUser(email: string): Promise<void> {
    try {
      await this.collection.doc(email).delete();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  /**
   * Check if user is admin
   */
  async isAdmin(email: string): Promise<boolean> {
    try {
      const user = await this.getUserByEmail(email);
      return user?.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Get all users (admin only) - handles both old and new structures
   */
  async getAllUsers(): Promise<User[]> {
    try {
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
      return users.sort((a, b) => a.email.localeCompare(b.email));
    } catch (error) {
      console.error('Error getting all users:', error);
      throw new Error('Failed to get users');
    }
  }

  /**
   * Get users count
   */
  async getUsersCount(): Promise<number> {
    try {
      const snapshot = await this.collection.get();
      return snapshot.size;
    } catch (error) {
      console.error('Error getting users count:', error);
      return 0;
    }
  }

  /**
   * Validate user access (main authorization check)
   */
  async validateUserAccess(email: string): Promise<UserValidationResult> {
    try {
      const user = await this.getUserByEmail(email);
      
      if (!user) {
        return {
          isValid: false,
          error: 'User not found'
        };
      }

      return {
        isValid: true,
        user
      };
    } catch (error) {
      console.error('Error validating user access:', error);
      return {
        isValid: false,
        error: 'Access validation failed'
      };
    }
  }
}

// Export singleton instance
export const userService = new UserService(); 