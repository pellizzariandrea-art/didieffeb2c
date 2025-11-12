// app/api/verify-email/route.ts
// API endpoint to verify email token and activate user

import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailToken } from '@/lib/firebase/email-verification';
import { getAdminAuth } from '@/lib/firebase/admin';
import { updateUserProfile, getUserProfileServer } from '@/lib/firebase/firestore-server';
import { sendB2BRegistrationConfirmation } from '@/lib/brevo';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 [API] Verifying email token...`);

    // Verify the token
    const result = await verifyEmailToken(token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Verification failed' },
        { status: 400 }
      );
    }

    const { userId, email } = result;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Invalid verification result' },
        { status: 500 }
      );
    }

    console.log(`✅ [API] Token verified for user ${userId}`);

    // Update user status to active in Firestore
    await updateUserProfile(userId, { status: 'active' });

    // Mark email as verified in Firebase Auth
    const auth = getAdminAuth();
    await auth.updateUser(userId, { emailVerified: true });

    console.log(`✅ [API] User ${userId} activated`);

    // Get user profile for B2B confirmation email (only if pending approval)
    const userProfile = await getUserProfileServer(userId);

    if (userProfile && userProfile.accountType === 'company') {
      const preferredLang = userProfile.preferredLanguage || 'it';

      // Send B2B registration confirmation (pending approval notice)
      try {
        const companyName = userProfile.ragioneSociale || userProfile.email;
        await sendB2BRegistrationConfirmation(userProfile.email, companyName, preferredLang);
        console.log(`📧 [API] B2B confirmation email sent to ${userProfile.email}`);
      } catch (emailError) {
        console.error('❌ [API] Failed to send B2B confirmation email:', emailError);
        // Don't fail the verification if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error: any) {
    console.error('❌ [API] Error verifying email:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
