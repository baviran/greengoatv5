import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { Logger } from '@/app/lib/utils/logger';
import { userService } from '@/app/lib/services/user-service';

export const GET = withAuth(async (request: NextRequest, authResult) => {
  const { user, context } = authResult;
  
  // Type guard: user should always be defined when auth is successful
  if (!user) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
  
  const logger = Logger.getInstance().withContext({
    ...context,
    component: 'admin-users-api',
    action: 'list-users'
  });

  try {
    // Check admin permissions
    if (!user.isAdmin) {
      logger.warn('Non-admin user attempted to access user listing');
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const role = url.searchParams.get('role') || undefined;
    const limitParam = url.searchParams.get('limit');
    const offsetParam = url.searchParams.get('offset');

    const limit = limitParam ? parseInt(limitParam) : 50;
    const offset = offsetParam ? parseInt(offsetParam) : 0;

    logger.info('Admin listing users', undefined, {
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

    const response = {
      users: safeUsers,
      pagination: {
        total: filteredUsers.length,
        count: safeUsers.length,
        limit,
        offset,
        hasMore: (offset + limit) < filteredUsers.length,
      },
      stats,
    };

    logger.info('Users retrieved successfully', undefined, {
      totalUsers: allUsers.length,
      returnedUsers: safeUsers.length,
      roleFilter: role || 'all',
      adminCount: stats.admins,
      userCount: stats.users
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Error in admin users GET', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest, authResult) => {
  const { user, context } = authResult;
  
  // Type guard: user should always be defined when auth is successful
  if (!user) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
  
  const logger = Logger.getInstance().withContext({
    ...context,
    component: 'admin-users-api',
    action: 'create-user'
  });

  try {
    // Check admin permissions
    if (!user.isAdmin) {
      logger.warn('Non-admin user attempted to create user');
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role = 'user' } = body;

    if (!email) {
      logger.warn('User creation attempted without email');
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!['admin', 'user'].includes(role)) {
      logger.warn('User creation attempted with invalid role', undefined, {
        invalidRole: role,
        validRoles: ['admin', 'user']
      });
      return NextResponse.json(
        { error: 'Role must be either "admin" or "user"' },
        { status: 400 }
      );
    }

    logger.info('Admin creating user', undefined, {
      targetEmail: email,
      targetRole: role
    });

    // Check if user already exists
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      logger.warn('User creation failed - user already exists', undefined, {
        targetEmail: email
      });
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Create the user
    const newUser = await userService.createUser({ email, role });

    logger.info('User created successfully', undefined, {
      createdEmail: email,
      createdRole: role
    });

    return NextResponse.json({
      email: newUser.email,
      role: newUser.role,
    });

  } catch (error) {
    logger.error('Error in admin users POST', error, undefined, {
      operation: 'create-user'
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const PUT = withAuth(async (request: NextRequest, authResult) => {
  const { user, context } = authResult;
  
  // Type guard: user should always be defined when auth is successful
  if (!user) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
  
  const logger = Logger.getInstance().withContext({
    ...context,
    component: 'admin-users-api',
    action: 'update-user'
  });

  try {
    // Check admin permissions
    if (!user.isAdmin) {
      logger.warn('Non-admin user attempted to update user');
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userEmail, role } = body;

    if (!userEmail) {
      logger.warn('User update attempted without userEmail');
      return NextResponse.json(
        { error: 'userEmail is required' },
        { status: 400 }
      );
    }

    if (!role) {
      logger.warn('User update attempted without role');
      return NextResponse.json(
        { error: 'role is required' },
        { status: 400 }
      );
    }

    if (!['admin', 'user'].includes(role)) {
      logger.warn('User update attempted with invalid role', undefined, {
        invalidRole: role,
        validRoles: ['admin', 'user']
      });
      return NextResponse.json(
        { error: 'Role must be either "admin" or "user"' },
        { status: 400 }
      );
    }

    logger.info('Admin updating user', undefined, {
      targetEmail: userEmail,
      newRole: role
    });

    // Check if user exists
    const existingUser = await userService.getUserByEmail(userEmail);
    if (!existingUser) {
      logger.warn('User update failed - user not found', undefined, {
        targetEmail: userEmail
      });
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update the user
    const updatedUser = await userService.updateUser(userEmail, { role });

    if (!updatedUser) {
      logger.error('User update failed - no updated user returned', undefined, undefined, {
        targetEmail: userEmail,
        newRole: role
      });
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    logger.info('User updated successfully', undefined, {
      updatedEmail: userEmail,
      updatedRole: role,
      previousRole: existingUser.role
    });

    return NextResponse.json({
      email: updatedUser.email,
      role: updatedUser.role,
    });

  } catch (error) {
    logger.error('Error in admin users PUT', error, undefined, {
      operation: 'update-user'
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (request: NextRequest, authResult) => {
  const { user, context } = authResult;
  
  // Type guard: user should always be defined when auth is successful
  if (!user) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
  
  const logger = Logger.getInstance().withContext({
    ...context,
    component: 'admin-users-api',
    action: 'delete-user'
  });

  try {
    // Check admin permissions
    if (!user.isAdmin) {
      logger.warn('Non-admin user attempted to delete user');
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const userEmail = url.searchParams.get('userEmail');

    if (!userEmail) {
      logger.warn('User deletion attempted without userEmail parameter');
      return NextResponse.json(
        { error: 'userEmail parameter is required' },
        { status: 400 }
      );
    }

    logger.info('Admin deleting user', undefined, {
      targetEmail: userEmail
    });

    // Check if user exists
    const existingUser = await userService.getUserByEmail(userEmail);
    if (!existingUser) {
      logger.warn('User deletion failed - user not found', undefined, {
        targetEmail: userEmail
      });
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of the last admin
    if (existingUser.role === 'admin') {
      const allUsers = await userService.getAllUsers();
      const adminCount = allUsers.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        logger.warn('User deletion failed - cannot delete last admin', undefined, {
          targetEmail: userEmail,
          adminCount: adminCount
        });
        return NextResponse.json(
          { error: 'Cannot delete the last admin user' },
          { status: 400 }
        );
      }
    }

    // Delete the user
    await userService.deleteUser(userEmail);

    logger.info('User deleted successfully', undefined, {
      deletedEmail: userEmail,
      deletedRole: existingUser.role
    });

    return NextResponse.json({
      message: 'User deleted successfully',
      userEmail,
    });

  } catch (error) {
    logger.error('Error in admin users DELETE', error, undefined, {
      operation: 'delete-user'
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}); 