import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndUser } from '@/lib/auth-middleware';
import { DecodedIdToken } from 'firebase-admin/auth';
import { User, UserCreateRequest, UserUpdateRequest } from '@/app/types/user';
import { userService } from '@/app/lib/services/user-service';

/**
 * Helper function to check if user is admin
 */
async function requireAdmin(firestoreUser: User): Promise<void> {
  if (firestoreUser.role !== 'admin') {
    throw new Error('Admin access required');
  }
}

/**
 * GET /api/admin/users - List all users (admin only)
 */
const authenticatedGET = withAuthAndUser(async (request: NextRequest, firebaseUser: DecodedIdToken, firestoreUser: User) => {
  try {
    // Check admin permissions
    await requireAdmin(firestoreUser);

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role'); // 'admin' | 'user' | 'all'
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log(`📋 Admin ${firestoreUser.email} listing users (role: ${role || 'all'})`);

    // Get all users
    const allUsers = await userService.getAllUsers();
    
    // Apply filters
    let filteredUsers = allUsers;
    
    if (role && role !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }

    // Apply pagination
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);
    
    // Return users with simplified structure
    const safeUsers = paginatedUsers.map(user => ({
      email: user.email,
      role: user.role
    }));

    const response = {
      users: safeUsers,
      pagination: {
        total: filteredUsers.length,
        count: safeUsers.length,
        limit,
        offset,
        hasMore: offset + limit < filteredUsers.length
      },
      stats: {
        total: allUsers.length,
        active: allUsers.length, // All users are active since we only store active users
        inactive: 0,
        admins: allUsers.filter(u => u.role === 'admin').length,
        users: allUsers.filter(u => u.role === 'user').length
      }
    };

    console.log(`✅ Admin ${firestoreUser.email} retrieved ${safeUsers.length} users`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in admin users GET:', error);
    
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/users - Create new user (admin only)
 */
const authenticatedPOST = withAuthAndUser(async (request: NextRequest, firebaseUser: DecodedIdToken, firestoreUser: User) => {
  try {
    // Check admin permissions
    await requireAdmin(firestoreUser);

    const body = await request.json() as UserCreateRequest;
    const { email, role } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    console.log(`👤 Admin ${firestoreUser.email} creating user: ${email}`);

    // Create user
    const newUser = await userService.createUser({
      email,
      role: role || 'user'
    });

    const safeUser = {
      email: newUser.email,
      role: newUser.role
    };

    console.log(`✅ Admin ${firestoreUser.email} created user: ${email}`);
    return NextResponse.json(safeUser, { status: 201 });

  } catch (error) {
    console.error('❌ Error in admin users POST:', error);
    
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/admin/users - Update user (admin only)
 */
const authenticatedPUT = withAuthAndUser(async (request: NextRequest, firebaseUser: DecodedIdToken, firestoreUser: User) => {
  try {
    // Check admin permissions
    await requireAdmin(firestoreUser);

    const body = await request.json() as UserUpdateRequest & { userEmail: string };
    const { userEmail, role } = body;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await userService.getUserByEmail(userEmail);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log(`🔄 Admin ${firestoreUser.email} updating user: ${userEmail}`);

    // Update user
    const updateData: any = {};
    if (role !== undefined) updateData.role = role;

    const updatedUser = await userService.updateUser(userEmail, updateData);
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    const safeUser = {
      email: updatedUser.email,
      role: updatedUser.role
    };

    console.log(`✅ Admin ${firestoreUser.email} updated user: ${userEmail}`);
    return NextResponse.json(safeUser);

  } catch (error) {
    console.error('❌ Error in admin users PUT:', error);
    
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/admin/users - Delete user (admin only)
 */
const authenticatedDELETE = withAuthAndUser(async (request: NextRequest, firebaseUser: DecodedIdToken, firestoreUser: User) => {
  try {
    // Check admin permissions
    await requireAdmin(firestoreUser);

    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await userService.getUserByEmail(userEmail);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent admin from deleting themselves
    if (userEmail === firestoreUser.email) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Admin ${firestoreUser.email} deleting user: ${userEmail}`);

    // Delete user
    await userService.deleteUser(userEmail);

    console.log(`✅ Admin ${firestoreUser.email} deleted user: ${userEmail}`);
    return NextResponse.json({ 
      message: 'User deleted successfully',
      userEmail 
    });

  } catch (error) {
    console.error('❌ Error in admin users DELETE:', error);
    
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export { 
  authenticatedGET as GET, 
  authenticatedPOST as POST, 
  authenticatedPUT as PUT, 
  authenticatedDELETE as DELETE 
}; 