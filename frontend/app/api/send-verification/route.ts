// app/api/send-verification/route.ts
// API endpoint to send email verification via Brevo

import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/brevo';

export async function POST(req: NextRequest) {
  try {
    const { userId, email, name, language = 'it' } = await req.json();

    if (!userId || !email || !name) {
      return NextResponse.json(
        { error: 'UserId, email and name are required' },
        { status: 400 }
      );
    }

    console.log(`📧 [API] Sending verification email to ${email} (${language})`);

    // Send verification email
    await sendVerificationEmail(userId, email, name, language);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ [API] Error sending verification email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send verification email' },
      { status: 500 }
    );
  }
}
