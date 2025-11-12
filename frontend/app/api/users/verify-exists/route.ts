// API route to verify if users exist in Firebase Auth
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const { userIds } = await req.json();

    if (!Array.isArray(userIds)) {
      return NextResponse.json(
        { error: 'userIds must be an array' },
        { status: 400 }
      );
    }

    const auth = getAdminAuth();
    const results: Record<string, boolean> = {};

    // Check each user in Firebase Auth
    for (const userId of userIds) {
      try {
        await auth.getUser(userId);
        results[userId] = true; // User exists
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          results[userId] = false; // User doesn't exist
        } else {
          console.error(`Error checking user ${userId}:`, error);
          results[userId] = true; // Assume exists on error (safe default)
        }
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error verifying users:', error);
    return NextResponse.json(
      { error: 'Failed to verify users' },
      { status: 500 }
    );
  }
}
