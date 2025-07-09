import { NextRequest } from 'next/server';
import { withApiResponse, createApiResponse, AuthResultWithContext, extractPaginationParams, createPaginationInfo } from '@/app/lib/utils/response-middleware';
import { ApiResponseBuilder, HTTP_STATUS } from '@/app/lib/utils/api-response';
import { Logger } from '@/app/lib/utils/logger';
import { userService } from '@/app/lib/services/user-service';

export const GET = withApiResponse('admin-users-api', 'list-users')(
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
        logger.warn('Non-admin user attempted to access user listing', context);
        const errorResponse = ApiResponseBuilder.forbidden('Admin access required', context);
        return createApiResponse(errorResponse, HTTP_STATUS.FORBIDDEN);
      }

      const url = new URL(request.url);
      const role = url.searchParams.get('role') || undefined;
      const { limit, offset } = extractPaginationParams(request);

      logger.info('Admin listing users', context, {
        roleFilter: role || 'all',
        limit: limit,
        offset: offset
      });

      // Get all users
      const allUsers = await userService.getAllUsers();
      
      // Filter by role if specified
      let filteredUsers = allUsers;
      if (role && role !== 'all') {
        filteredUsers = allUsers.filter(user => user.role === role);
      }

      // Apply pagination
      const paginatedUsers = filteredUsers.slice(offset, offset + limit);
      
      // Count stats
      const stats = {
        total: allUsers.length,
        active: allUsers.length, // All users in system are active
        inactive: 0,
        admins: allUsers.filter(u => u.role === 'admin').length,
        users: allUsers.filter(u => u.role === 'user').length,
      };

      // Safe user data (remove sensitive fields if any)
      const safeUsers = paginatedUsers.map(user => ({
        email: user.email,
        role: user.role,
      }));

      const pagination = createPaginationInfo(
        filteredUsers.length,
        safeUsers.length,
        limit,
        offset
      );

      logger.info('Users retrieved successfully', context, {
        totalUsers: allUsers.length,
        returnedUsers: safeUsers.length,
        roleFilter: role || 'all',
        adminCount: stats.admins,
        userCount: stats.users
      });

      // Return paginated response with stats in metadata
      const response = ApiResponseBuilder.paginated(
        safeUsers,
        pagination,
        context,
        { stats }
      );

      return createApiResponse(response, HTTP_STATUS.OK);

    } catch (error) {
      logger.error('Error in admin users GET', error, context);
      const errorResponse = ApiResponseBuilder.internalError('Internal server error', context);
      return createApiResponse(errorResponse, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
);

export const POST = withApiResponse('admin-users-api', 'create-user')(
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
        logger.warn('Non-admin user attempted to create user', context);
        const errorResponse = ApiResponseBuilder.forbidden('Admin access required', context);
        return createApiResponse(errorResponse, HTTP_STATUS.FORBIDDEN);
      }

      const body = await request.json();
      const { email, role = 'user' } = body;

      if (!email) {
        logger.warn('User creation attempted without email', context);
        const errorResponse = ApiResponseBuilder.validationError('Email is required', context, 'email');
        return createApiResponse(errorResponse, HTTP_STATUS.BAD_REQUEST);
      }

      if (!['admin', 'user'].includes(role)) {
        logger.warn('User creation attempted with invalid role', context, {
          invalidRole: role,
          validRoles: ['admin', 'user']
        });
        const errorResponse = ApiResponseBuilder.validationError('Role must be either "admin" or "user"', context, 'role');
        return createApiResponse(errorResponse, HTTP_STATUS.BAD_REQUEST);
      }

      logger.info('Admin creating user', context, {
        targetEmail: email,
        targetRole: role
      });

      // Check if user already exists
      const existingUser = await userService.getUserByEmail(email);
      if (existingUser) {
        logger.warn('User creation failed - user already exists', context, {
          targetEmail: email
        });
        const errorResponse = ApiResponseBuilder.conflict('User already exists', context);
        return createApiResponse(errorResponse, HTTP_STATUS.CONFLICT);
      }

      // Create the user
      const newUser = await userService.createUser({ email, role });

      logger.info('User created successfully', context, {
        createdEmail: email,
        createdRole: role
      });

      const responseData = {
        email: newUser.email,
        role: newUser.role,
      };

      const successResponse = ApiResponseBuilder.success(responseData, context);
      return createApiResponse(successResponse, HTTP_STATUS.CREATED);

    } catch (error) {
      logger.error('Error in admin users POST', error, context, {
        operation: 'create-user'
      });
      const errorResponse = ApiResponseBuilder.internalError('Internal server error', context);
      return createApiResponse(errorResponse, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
);

export const PUT = withApiResponse('admin-users-api', 'update-user')(
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
        logger.warn('Non-admin user attempted to update user', context);
        const errorResponse = ApiResponseBuilder.forbidden('Admin access required', context);
        return createApiResponse(errorResponse, HTTP_STATUS.FORBIDDEN);
      }

      const body = await request.json();
      const { userEmail, role } = body;

      if (!userEmail) {
        logger.warn('User update attempted without userEmail', context);
        const errorResponse = ApiResponseBuilder.validationError('userEmail is required', context, 'userEmail');
        return createApiResponse(errorResponse, HTTP_STATUS.BAD_REQUEST);
      }

      if (!role) {
        logger.warn('User update attempted without role', context);
        const errorResponse = ApiResponseBuilder.validationError('role is required', context, 'role');
        return createApiResponse(errorResponse, HTTP_STATUS.BAD_REQUEST);
      }

      if (!['admin', 'user'].includes(role)) {
        logger.warn('User update attempted with invalid role', context, {
          invalidRole: role,
          validRoles: ['admin', 'user']
        });
        const errorResponse = ApiResponseBuilder.validationError('Role must be either "admin" or "user"', context, 'role');
        return createApiResponse(errorResponse, HTTP_STATUS.BAD_REQUEST);
      }

      logger.info('Admin updating user', context, {
        targetEmail: userEmail,
        newRole: role
      });

      // Check if user exists
      const existingUser = await userService.getUserByEmail(userEmail);
      if (!existingUser) {
        logger.warn('User update failed - user not found', context, {
          targetEmail: userEmail
        });
        const errorResponse = ApiResponseBuilder.notFound('User not found', context);
        return createApiResponse(errorResponse, HTTP_STATUS.NOT_FOUND);
      }

      // Update the user
      const updatedUser = await userService.updateUser(userEmail, { role });

      if (!updatedUser) {
        logger.error('User update failed - no updated user returned', new Error('Failed to update user'), context, {
          targetEmail: userEmail,
          newRole: role
        });
        const errorResponse = ApiResponseBuilder.internalError('Failed to update user', context);
        return createApiResponse(errorResponse, HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }

      logger.info('User updated successfully', context, {
        updatedEmail: userEmail,
        updatedRole: role,
        previousRole: existingUser.role
      });

      const responseData = {
        email: updatedUser.email,
        role: updatedUser.role,
      };

      const successResponse = ApiResponseBuilder.success(responseData, context);
      return createApiResponse(successResponse, HTTP_STATUS.OK);

    } catch (error) {
      logger.error('Error in admin users PUT', error, context, {
        operation: 'update-user'
      });
      const errorResponse = ApiResponseBuilder.internalError('Internal server error', context);
      return createApiResponse(errorResponse, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
);

export const DELETE = withApiResponse('admin-users-api', 'delete-user')(
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
        logger.warn('Non-admin user attempted to delete user', context);
        const errorResponse = ApiResponseBuilder.forbidden('Admin access required', context);
        return createApiResponse(errorResponse, HTTP_STATUS.FORBIDDEN);
      }

      const url = new URL(request.url);
      const userEmail = url.searchParams.get('userEmail');

      if (!userEmail) {
        logger.warn('User deletion attempted without userEmail parameter', context);
        const errorResponse = ApiResponseBuilder.validationError('userEmail parameter is required', context, 'userEmail');
        return createApiResponse(errorResponse, HTTP_STATUS.BAD_REQUEST);
      }

      logger.info('Admin deleting user', context, {
        targetEmail: userEmail
      });

      // Check if user exists
      const existingUser = await userService.getUserByEmail(userEmail);
      if (!existingUser) {
        logger.warn('User deletion failed - user not found', context, {
          targetEmail: userEmail
        });
        const errorResponse = ApiResponseBuilder.notFound('User not found', context);
        return createApiResponse(errorResponse, HTTP_STATUS.NOT_FOUND);
      }

      // Prevent deletion of the last admin
      if (existingUser.role === 'admin') {
        const allUsers = await userService.getAllUsers();
        const adminCount = allUsers.filter(u => u.role === 'admin').length;
        if (adminCount <= 1) {
          logger.warn('User deletion failed - cannot delete last admin', context, {
            targetEmail: userEmail,
            adminCount: adminCount
          });
          const errorResponse = ApiResponseBuilder.validationError('Cannot delete the last admin user', context);
          return createApiResponse(errorResponse, HTTP_STATUS.BAD_REQUEST);
        }
      }

      // Delete the user
      await userService.deleteUser(userEmail);

      logger.info('User deleted successfully', context, {
        deletedEmail: userEmail,
        deletedRole: existingUser.role
      });

      const responseData = {
        message: 'User deleted successfully',
        userEmail,
      };

      const successResponse = ApiResponseBuilder.success(responseData, context);
      return createApiResponse(successResponse, HTTP_STATUS.OK);

    } catch (error) {
      logger.error('Error in admin users DELETE', error, context, {
        operation: 'delete-user'
      });
      const errorResponse = ApiResponseBuilder.internalError('Internal server error', context);
      return createApiResponse(errorResponse, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
); 