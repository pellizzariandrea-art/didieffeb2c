// app/api/send-welcome/route.ts
// API endpoint to send welcome email via Brevo

import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmailB2C, sendB2BRegistrationConfirmation } from '@/lib/brevo';

export async function POST(req: NextRequest) {
  try {
    const { email, name, type, language = 'it' } = await req.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Send appropriate email based on customer type
    if (type === 'b2b') {
      await sendB2BRegistrationConfirmation(email, name, language);
    } else {
      // Default to B2C welcome email
      await sendWelcomeEmailB2C(email, name, language);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ [API] Error sending welcome email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
