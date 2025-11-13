// API route to delete a user from both Firebase Auth and Firestore (Admin only)
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const auth = getAdminAuth();
    const db = getAdminFirestore();

    console.log(`🗑️ Starting deletion process for user: ${userId}`);

    // Step 1: Delete from Firebase Auth
    try {
      await auth.deleteUser(userId);
      console.log('✅ User deleted from Firebase Auth');
    } catch (authError: any) {
      // If user doesn't exist in Auth, log it but continue
      if (authError.code === 'auth/user-not-found') {
        console.warn('⚠️ User not found in Firebase Auth (may be orphaned)');
      } else {
        throw authError;
      }
    }

    // Step 2: Delete from Firestore
    await db.collection('users').doc(userId).delete();
    console.log('✅ User deleted from Firestore');

    // Step 3: Delete any associated password setup tokens
    const tokensSnapshot = await db.collection('password_setup_tokens')
      .where('userId', '==', userId)
      .get();

    const deleteTokenPromises = tokensSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deleteTokenPromises);

    if (tokensSnapshot.size > 0) {
      console.log(`✅ Deleted ${tokensSnapshot.size} password setup token(s)`);
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully from Auth, Firestore, and associated tokens'
    });

  } catch (error: any) {
    console.error('❌ Error deleting user:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete user',
        details: error.message
      },
      { status: 500 }
    );
  }
}
