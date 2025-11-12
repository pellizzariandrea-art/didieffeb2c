// lib/firebase/firestore-server.ts
// Firestore operations using Admin SDK (server-side only)

import { getAdminFirestore } from './admin';
import type { UserProfile } from '@/types/auth';

const USERS_COLLECTION = 'users';

/**
 * Get user profile by ID (server-side)
 */
export async function getUserProfileServer(userId: string): Promise<UserProfile | null> {
  try {
    const db = getAdminFirestore();
    const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();

    if (!userDoc.exists) {
      return null;
    }

    const data = userDoc.data();

    // Helper to convert timestamp or ISO string to Date
    const toDate = (value: any, fallback?: Date): Date | undefined => {
      if (!value) return fallback;
      if (typeof value === 'string') return new Date(value);
      if (value.toDate && typeof value.toDate === 'function') return value.toDate();
      return fallback;
    };

    return {
      ...data,
      createdAt: toDate(data?.createdAt, new Date()),
      updatedAt: toDate(data?.updatedAt, new Date()),
      lastLogin: toDate(data?.lastLogin),
    } as UserProfile;
  } catch (error) {
    console.error('❌ [Firestore Server] Error getting user profile:', error);
    return null;
  }
}

/**
 * Update user profile (server-side)
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<void> {
  try {
    const db = getAdminFirestore();
    const userRef = db.collection(USERS_COLLECTION).doc(userId);

    await userRef.update({
      ...updates,
      updatedAt: new Date(),
    });

    console.log(`✅ [Firestore Server] User profile updated: ${userId}`);
  } catch (error) {
    console.error('❌ [Firestore Server] Error updating user profile:', error);
    throw error;
  }
}

/**
 * Create user profile (server-side)
 */
export async function createUserProfileServer(
  userId: string,
  profile: UserProfile
): Promise<void> {
  try {
    const db = getAdminFirestore();
    const userRef = db.collection(USERS_COLLECTION).doc(userId);

    await userRef.set({
      ...profile,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`✅ [Firestore Server] User profile created: ${userId}`);
  } catch (error) {
    console.error('❌ [Firestore Server] Error creating user profile:', error);
    throw error;
  }
}
