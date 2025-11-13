// API route to send password reset email via Brevo
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';
import { getAppSettingsServer } from '@/lib/firebase/settings-server';
import { getEmailTemplatesServer } from '@/lib/firebase/email-templates-server';
import { replaceVariables } from '@/types/email-template';
import { wrapEmailContent } from '@/lib/email-template-wrapper';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const auth = getAdminAuth();
    const db = getAdminFirestore();

    // Get user profile to get preferred language
    const userRecord = await auth.getUserByEmail(email);
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    const userData = userDoc.data();
    const preferredLanguage = userData?.preferredLanguage || 'it';
    const userName = userData?.nome || userData?.ragioneSociale || email.split('@')[0];

    // Generate custom password reset token (valid for 24 hours)
    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Save token in Firestore
    await db.collection('password_setup_tokens').doc(resetToken).set({
      userId: userRecord.uid,
      email,
      expiresAt,
      used: false,
      createdAt: new Date(),
      type: 'password-reset',
    });

    // Create reset link pointing to our custom page
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL
      || req.headers.get('origin')
      || req.headers.get('referer')?.split('/').slice(0, 3).join('/')
      || 'http://localhost:3000';

    const resetLink = `${baseUrl}/auth/setup-password?token=${resetToken}`;
    console.log('🔐 Password reset link generated (valid 24h):', resetLink);

    // Get app settings for Brevo configuration
    const settings = await getAppSettingsServer();

    // Load email template from Firestore
    const allTemplates = await getEmailTemplatesServer();
    const template = allTemplates.find(
      t => t.slug === 'reset-password' && t.enabled
    );

    if (!template) {
      console.error('❌ [Reset Password] Template "reset-password" not found');
      return NextResponse.json(
        { error: 'Email template not configured' },
        { status: 500 }
      );
    }

    // Get email content in specified language
    const emailContent = template.translations[preferredLanguage];

    if (!emailContent || !emailContent.subject || !emailContent.body) {
      console.error(`❌ [Reset Password] Template missing translation for ${preferredLanguage}`);
      return NextResponse.json(
        { error: 'Email template translation missing' },
        { status: 500 }
      );
    }

    // Variables to replace
    const variables: Record<string, string> = {
      nome: userName,
      link: resetLink,
    };

    // Replace variables in subject and body
    const subject = replaceVariables(emailContent.subject, variables);
    const bodyContent = replaceVariables(emailContent.body, variables);

    // Wrap content with branded template
    const htmlContent = wrapEmailContent({
      logo: settings.logo,
      company: settings.company,
      content: bodyContent,
      preheader: 'Reset della password - ' + settings.company.name,
    });

    // Send email via Brevo proxy
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://shop.didieffeb2b.com';
    const payload = {
      to: { email, name: userName },
      subject,
      htmlContent,
      sender: {
        name: settings.brevo.senderName,
        email: settings.brevo.senderEmail,
      },
      replyTo: {
        name: settings.brevo.replyToName,
        email: settings.brevo.replyToEmail,
      },
    };

    console.log('📤 [Brevo] Sending password reset email to proxy...');
    const response = await fetch(`${backendUrl}/admin/api/send-brevo-email.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('📥 [Brevo] Proxy response status:', response.status);

    if (!response.ok) {
      console.error('❌ [Brevo] Proxy error:', responseText);

      // Log failed email
      const { logEmail } = await import('@/lib/email-logger');
      await logEmail({
        to: email,
        subject,
        templateSlug: 'reset-password',
        status: 'error',
        error: `HTTP ${response.status}: ${responseText}`,
      });

      throw new Error('Failed to send email via Brevo proxy');
    }

    const result = JSON.parse(responseText);
    console.log('✅ [Brevo] Password reset email sent successfully:', result.messageId);

    // Log successful email
    const { logEmail } = await import('@/lib/email-logger');
    await logEmail({
      to: email,
      subject,
      templateSlug: 'reset-password',
      status: 'success',
      messageId: result.messageId,
      brevoResponse: result,
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully'
    });
  } catch (error: any) {
    console.error('❌ Error sending password reset email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send password reset email' },
      { status: 500 }
    );
  }
}
