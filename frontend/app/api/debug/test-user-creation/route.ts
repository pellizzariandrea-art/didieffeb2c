// Debug endpoint to test user creation flow
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';

export async function GET(req: NextRequest) {
  try {
    const logs: string[] = [];

    // Test 1: Firebase Admin SDK
    logs.push('1. Testing Firebase Admin SDK...');
    try {
      const auth = getAdminAuth();
      const db = getAdminFirestore();
      logs.push('✅ Firebase Admin SDK initialized');
    } catch (error: any) {
      logs.push(`❌ Firebase Admin SDK error: ${error.message}`);
      return NextResponse.json({ success: false, logs, error: error.message });
    }

    // Test 2: Check origin header
    logs.push('\n2. Testing origin detection...');
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'NOT_FOUND';
    logs.push(`Origin: ${origin}`);

    // Test 3: Check backend URL
    logs.push('\n3. Testing backend URL...');
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'NOT_SET';
    logs.push(`Backend URL: ${backendUrl}`);

    // Test 4: Check if email templates exist
    logs.push('\n4. Testing email templates...');
    try {
      const { getEmailTemplatesServer } = await import('@/lib/firebase/email-templates-server');
      const allTemplates = await getEmailTemplatesServer();
      const accountSetupTemplate = allTemplates.find(t => t.slug === 'account-setup');

      if (accountSetupTemplate) {
        logs.push(`✅ Found account-setup template (enabled: ${accountSetupTemplate.enabled})`);
        logs.push(`   Languages: ${Object.keys(accountSetupTemplate.translations).join(', ')}`);
      } else {
        logs.push('❌ account-setup template not found');
      }
    } catch (error: any) {
      logs.push(`❌ Template error: ${error.message}`);
    }

    // Test 5: Check settings
    logs.push('\n5. Testing app settings...');
    try {
      const { getAppSettingsServer } = await import('@/lib/firebase/settings-server');
      const settings = await getAppSettingsServer();
      logs.push(`✅ Settings loaded`);
      logs.push(`   Brevo sender: ${settings.brevo.senderEmail}`);
    } catch (error: any) {
      logs.push(`❌ Settings error: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      logs: logs.join('\n'),
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
