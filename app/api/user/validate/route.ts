import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndUser } from '@/lib/auth-middleware';
import { DecodedIdToken } from 'firebase-admin/auth';
import { User } from '@/app/types/user';

const authenticatedGET = withAuthAndUser(async (request: NextRequest, firebaseUser: DecodedIdToken, firestoreUser: User) => {
  try {
    // If we reach here, the user is authenticated and validated
    return NextResponse.json({
      success: true,
      user: {
        uid: firebaseUser.uid,
        email: firestoreUser.email,
        displayName: firebaseUser.name || firebaseUser.email,
        role: firestoreUser.role,
        status: 'active' // All users in the system are active
      }
    });
  } catch (error) {
    console.error('❌ Error in user validation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export { authenticatedGET as GET }; 