import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { Logger } from '@/app/lib/utils/logger';

export const GET = withAuth(async (request: NextRequest, authResult) => {
  const { user, context } = authResult;
  
  // Type guard: user should always be defined when auth is successful
  if (!user) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
  
  const logger = Logger.getInstance().withContext({
    ...context,
    component: 'user-validate-api',
    action: 'validate-user'
  });

  try {
    logger.info('User validation request processed successfully');
    
    // If we reach here, the user is authenticated and validated
    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.email, // Use email as display name
        role: user.isAdmin ? 'admin' : 'user',
        status: 'active' // All users in the system are active
      }
    });
  } catch (error) {
    logger.error('Error in user validation', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}); 