// API route to create a new user (Admin only)
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';
import { getAppSettingsServer } from '@/lib/firebase/settings-server';
import { randomBytes } from 'crypto';
import { logEmail } from '@/lib/email-logger';
import { wrapEmailContent } from '@/lib/email-template-wrapper';

export async function POST(req: NextRequest) {
  try {
    const userData = await req.json();

    const { email, role, ...profileData } = userData;

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    const auth = getAdminAuth();
    const db = getAdminFirestore();

    // Generate temporary random password (user will set their own)
    const tempPassword = randomBytes(16).toString('hex');

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password: tempPassword,
      emailVerified: false,
    });

    console.log('✅ User created in Auth:', userRecord.uid);

    // Create user profile in Firestore
    const profile = {
      email,
      role,
      status: profileData.status || 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...profileData,
    };

    await db.collection('users').doc(userRecord.uid).set(profile);
    console.log('✅ User profile created in Firestore');

    // Generate custom password setup token (valid for 24 hours)
    const setupToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Valid for 24 hours

    // Save token in Firestore
    await db.collection('password_setup_tokens').doc(setupToken).set({
      userId: userRecord.uid,
      email,
      expiresAt,
      used: false,
      createdAt: new Date(),
    });

    // Create setup link pointing to our custom page
    // Use path-based token (not query param) to be compatible with Brevo click tracking
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL
      || req.headers.get('origin')
      || req.headers.get('referer')?.split('/').slice(0, 3).join('/')
      || 'http://localhost:3000';

    const resetLink = `${baseUrl}/auth/reset/${setupToken}`;
    console.log('🔐 Password setup link generated (valid 24h):', resetLink);

    // Get settings and send welcome email with password setup instructions
    const settings = await getAppSettingsServer();
    const preferredLanguage = profileData.preferredLanguage || 'it';
    const userName = profileData.nome || profileData.ragioneSociale || email.split('@')[0];

    // Load email template from Firestore
    const { getEmailTemplatesServer } = await import('@/lib/firebase/email-templates-server');
    const { replaceVariables } = await import('@/types/email-template');

    const allTemplates = await getEmailTemplatesServer();
    const template = allTemplates.find(
      t => t.slug === 'account-setup' && t.enabled
    );

    if (!template) {
      console.error('❌ [Account Setup] Template "account-setup" not found');
      return NextResponse.json(
        { error: 'Email template not configured' },
        { status: 500 }
      );
    }

    // Get email content in specified language
    const emailContent = template.translations[preferredLanguage];

    if (!emailContent || !emailContent.subject || !emailContent.body) {
      console.error(`❌ [Account Setup] Template missing translation for ${preferredLanguage}`);
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
      preheader: 'Benvenuto su ' + settings.company.name,
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

    console.log('📤 [Brevo] Sending password setup email...');
    try {
      const emailResponse = await fetch(`${backendUrl}/admin/api/send-brevo-email.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (emailResponse.ok) {
        const emailResult = await emailResponse.json();
        console.log('✅ [Brevo] Setup email sent:', emailResult.messageId);

        // Log successful email
        await logEmail({
          to: email,
          subject,
          templateSlug: 'account-setup',
          status: 'success',
          messageId: emailResult.messageId,
          brevoResponse: emailResult,
        });
      } else {
        const errorText = await emailResponse.text();
        console.error('⚠️ [Brevo] Failed to send setup email:', errorText);

        // Log failed email
        await logEmail({
          to: email,
          subject,
          templateSlug: 'account-setup',
          status: 'error',
          error: `HTTP ${emailResponse.status}: ${errorText}`,
        });
      }
    } catch (emailError: any) {
      console.error('❌ [Brevo] Error sending email:', emailError);

      // Log error
      await logEmail({
        to: email,
        subject,
        templateSlug: 'account-setup',
        status: 'error',
        error: emailError.message,
      });
    }

    return NextResponse.json({
      success: true,
      userId: userRecord.uid,
      message: 'User created successfully and setup email sent',
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
