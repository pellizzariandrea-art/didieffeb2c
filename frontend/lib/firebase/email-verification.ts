// lib/firebase/email-verification.ts
// Email Verification System using Firestore

import { getAdminFirestore } from './admin';
import { randomBytes } from 'crypto';

const VERIFICATION_COLLECTION = 'email_verifications';
const TOKEN_EXPIRY_HOURS = 24;

export interface EmailVerificationToken {
  userId: string;
  email: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  verified: boolean;
  verifiedAt?: Date;
}

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create email verification token (server-side)
 */
export async function createVerificationToken(
  userId: string,
  email: string
): Promise<string> {
  try {
    const db = getAdminFirestore();
    const token = generateToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    const verificationData: EmailVerificationToken = {
      userId,
      email,
      token,
      createdAt: now,
      expiresAt,
      verified: false,
    };

    // Save to Firestore
    await db.collection(VERIFICATION_COLLECTION).doc(token).set(verificationData);

    console.log(`✅ [Verification] Token created for ${email}, expires at ${expiresAt}`);
    return token;
  } catch (error) {
    console.error('❌ [Verification] Error creating token:', error);
    throw new Error('Failed to create verification token');
  }
}

/**
 * Verify email token (server-side)
 */
export async function verifyEmailToken(token: string): Promise<{
  success: boolean;
  userId?: string;
  email?: string;
  error?: string;
}> {
  try {
    const db = getAdminFirestore();
    const tokenDoc = await db.collection(VERIFICATION_COLLECTION).doc(token).get();

    if (!tokenDoc.exists) {
      return { success: false, error: 'Token non valido' };
    }

    const data = tokenDoc.data() as EmailVerificationToken;

    // Check if already verified
    if (data.verified) {
      return { success: false, error: 'Email già verificata' };
    }

    // Check if expired
    const now = new Date();
    const expiresAt = data.expiresAt instanceof Date ? data.expiresAt : data.expiresAt.toDate();

    if (now > expiresAt) {
      return { success: false, error: 'Token scaduto' };
    }

    // Mark as verified
    await tokenDoc.ref.update({
      verified: true,
      verifiedAt: now,
    });

    console.log(`✅ [Verification] Email verified for user ${data.userId}`);
    return { success: true, userId: data.userId, email: data.email };
  } catch (error) {
    console.error('❌ [Verification] Error verifying token:', error);
    return { success: false, error: 'Errore durante la verifica' };
  }
}

/**
 * Check if user has pending verification
 */
export async function hasPendingVerification(userId: string): Promise<boolean> {
  try {
    const db = getAdminFirestore();
    const snapshot = await db
      .collection(VERIFICATION_COLLECTION)
      .where('userId', '==', userId)
      .where('verified', '==', false)
      .get();

    return !snapshot.empty;
  } catch (error) {
    console.error('❌ [Verification] Error checking pending verification:', error);
    return false;
  }
}

/**
 * Delete old verification tokens (cleanup)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const db = getAdminFirestore();
    const now = new Date();

    const snapshot = await db
      .collection(VERIFICATION_COLLECTION)
      .where('expiresAt', '<', now)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));

    await batch.commit();

    console.log(`✅ [Verification] Cleaned up ${snapshot.size} expired tokens`);
    return snapshot.size;
  } catch (error) {
    console.error('❌ [Verification] Error cleaning up tokens:', error);
    return 0;
  }
}
