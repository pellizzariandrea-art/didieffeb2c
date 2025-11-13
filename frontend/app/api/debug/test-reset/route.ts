// Debug endpoint to test password reset flow
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';
import { getAppSettingsServer } from '@/lib/firebase/settings-server';
import { getEmailTemplatesServer } from '@/lib/firebase/email-templates-server';

export async function GET(req: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    checks: {},
  };

  try {
    // 1. Test Firebase Admin Auth
    try {
      const auth = getAdminAuth();
      diagnostics.checks.firebaseAuth = { status: 'ok', message: 'Firebase Auth initialized' };
    } catch (error: any) {
      diagnostics.checks.firebaseAuth = { status: 'error', error: error.message };
    }

    // 2. Test Firestore connection
    try {
      const db = getAdminFirestore();
      diagnostics.checks.firestore = { status: 'ok', message: 'Firestore initialized' };
    } catch (error: any) {
      diagnostics.checks.firestore = { status: 'error', error: error.message };
    }

    // 3. Test App Settings
    try {
      const settings = await getAppSettingsServer();
      diagnostics.checks.appSettings = {
        status: 'ok',
        brevo: {
          senderEmail: settings.brevo?.senderEmail,
          senderName: settings.brevo?.senderName,
          replyToEmail: settings.brevo?.replyToEmail,
        },
      };
    } catch (error: any) {
      diagnostics.checks.appSettings = { status: 'error', error: error.message };
    }

    // 4. Test Email Templates
    try {
      const templates = await getEmailTemplatesServer();
      const resetTemplate = templates.find(t => t.slug === 'reset-password' && t.enabled);
      diagnostics.checks.emailTemplates = {
        status: 'ok',
        totalTemplates: templates.length,
        resetPasswordTemplate: resetTemplate ? {
          found: true,
          enabled: resetTemplate.enabled,
          languages: Object.keys(resetTemplate.translations || {}),
        } : {
          found: false,
        },
      };
    } catch (error: any) {
      diagnostics.checks.emailTemplates = { status: 'error', error: error.message };
    }

    // 5. Test Brevo Proxy connection
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://shop.didieffeb2b.com';
      diagnostics.checks.brevoProxy = {
        status: 'pending',
        url: `${backendUrl}/admin/api/send-brevo-email.php`,
      };
    } catch (error: any) {
      diagnostics.checks.brevoProxy = { status: 'error', error: error.message };
    }

    // 6. Environment variables
    diagnostics.env = {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'not set (using fallback)',
      VERCEL_URL: process.env.VERCEL_URL || 'not set',
      NODE_ENV: process.env.NODE_ENV,
    };

    return NextResponse.json(diagnostics, { status: 200 });
  } catch (error: any) {
    diagnostics.globalError = error.message;
    return NextResponse.json(diagnostics, { status: 500 });
  }
}
