import { UserCreateRequest, UserUpdateRequest } from '@/app/types/user';
import { Logger } from '@/app/lib/utils/logger';

interface AdminUser {
  email: string;
  role: 'admin' | 'user';
}

interface AdminUsersResponse {
  users: AdminUser[];
  pagination: {
    total: number;
    count: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  stats: {
    total: number;
    active: number;
    inactive: number;
    admins: number;
    users: number;
  };
}

interface AdminApiOptions {
  role?: 'admin' | 'user' | 'all';
  limit?: number;
  offset?: number;
}

export class AdminService {
  private logger = Logger.getInstance().withContext({
    component: 'admin-service'
  });

  private async makeAuthenticatedRequest(
    endpoint: string,
    options: RequestInit & { token?: string } = {}
  ): Promise<Response> {
    const { token, ...fetchOptions } = options;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add existing headers if they exist
    if (fetchOptions.headers) {
      Object.entries(fetchOptions.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Request failed: ${response.statusText}`);
    }

    return response;
  }

  /**
   * Get all users with filtering and pagination
   */
  async getUsers(token: string, options: AdminApiOptions = {}): Promise<AdminUsersResponse> {
    const { role = 'all', limit = 50, offset = 0 } = options;
    
    const params = new URLSearchParams({
      role,
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await this.makeAuthenticatedRequest(
      `/api/admin/users?${params}`,
      { token }
    );

    return response.json();
  }

  /**
   * Create a new user
   */
  async createUser(token: string, userData: UserCreateRequest): Promise<AdminUser> {
    const response = await this.makeAuthenticatedRequest(
      '/api/admin/users',
      {
        method: 'POST',
        body: JSON.stringify(userData),
        token,
      }
    );

    return response.json();
  }

  /**
   * Update user
   */
  async updateUser(
    token: string,
    userEmail: string,
    updateData: UserUpdateRequest
  ): Promise<AdminUser> {
    const response = await this.makeAuthenticatedRequest(
      '/api/admin/users',
      {
        method: 'PUT',
        body: JSON.stringify({ userEmail, ...updateData }),
        token,
      }
    );

    return response.json();
  }

  /**
   * Delete user
   */
  async deleteUser(token: string, userEmail: string): Promise<{ message: string; userEmail: string }> {
    const response = await this.makeAuthenticatedRequest(
      `/api/admin/users?userEmail=${encodeURIComponent(userEmail)}`,
      {
        method: 'DELETE',
        token,
      }
    );

    return response.json();
  }

  /**
   * Change user role
   */
  async changeUserRole(token: string, userEmail: string, role: 'admin' | 'user'): Promise<AdminUser> {
    return this.updateUser(token, userEmail, { role });
  }

  /**
   * Get user statistics
   */
  async getUserStats(token: string): Promise<AdminUsersResponse['stats']> {
    const response = await this.getUsers(token, { limit: 1 });
    return response.stats;
  }

  /**
   * Search users by email
   */
  async searchUsers(token: string, query: string): Promise<AdminUser[]> {
    const response = await this.getUsers(token, { limit: 100 });
    return response.users.filter(user => 
      user.email.toLowerCase().includes(query.toLowerCase())
    );
  }
}

// Export singleton instance
export const adminService = new AdminService();

// React hook for admin operations
export function useAdminService() {
  const logger = Logger.getInstance().withContext({
    component: 'admin-service-hook'
  });

  const makeRequest = async (operation: (token: string) => Promise<any>) => {
    let user: any = null;
    try {
      // Get token from Firebase Auth
      const { auth } = await import('@/lib/firebase');
      user = auth.currentUser;
      
      if (!user) {
        logger.warn('User not authenticated for admin service');
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken(true);
      return await operation(token);
    } catch (error) {
      logger.error('Admin service error', error, undefined, {
        userId: user?.uid,
        userEmail: user?.email
      });
      throw error;
    }
  };

  return {
    getUsers: (options?: AdminApiOptions) => makeRequest((token) => adminService.getUsers(token, options)),
    createUser: (userData: UserCreateRequest) => makeRequest((token) => adminService.createUser(token, userData)),
    updateUser: (userEmail: string, updateData: UserUpdateRequest) => makeRequest((token) => adminService.updateUser(token, userEmail, updateData)),
    deleteUser: (userEmail: string) => makeRequest((token) => adminService.deleteUser(token, userEmail)),
    changeUserRole: (userEmail: string, role: 'admin' | 'user') => makeRequest((token) => adminService.changeUserRole(token, userEmail, role)),
    getUserStats: () => makeRequest((token) => adminService.getUserStats(token)),
    searchUsers: (query: string) => makeRequest((token) => adminService.searchUsers(token, query)),
  };
} 