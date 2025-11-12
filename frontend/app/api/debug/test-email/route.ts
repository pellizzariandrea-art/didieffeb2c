// Debug endpoint to test complete email flow
import { NextRequest, NextResponse } from 'next/server';

async function testEmailFlow(req: NextRequest) {
  const logs: string[] = [];

  try {
    logs.push('=== EMAIL FLOW TEST ===\n');

    // Test 1: Get settings
    logs.push('1. Loading settings...');
    const { getAppSettingsServer } = await import('@/lib/firebase/settings-server');
    const settings = await getAppSettingsServer();
    logs.push(`✅ Settings loaded: ${settings.brevo.senderEmail}`);

    // Test 2: Get template
    logs.push('\n2. Loading email template...');
    const { getEmailTemplatesServer } = await import('@/lib/firebase/email-templates-server');
    const { replaceVariables } = await import('@/types/email-template');

    const allTemplates = await getEmailTemplatesServer();
    const template = allTemplates.find(t => t.slug === 'account-setup' && t.enabled);

    if (!template) {
      logs.push('❌ Template not found');
      return NextResponse.json({ success: false, logs: logs.join('\n'), error: 'Template not found' });
    }
    logs.push(`✅ Template found: ${template.slug}`);

    // Test 3: Get email content
    logs.push('\n3. Getting email content...');
    const emailContent = template.translations['it'];
    if (!emailContent || !emailContent.subject || !emailContent.body) {
      logs.push('❌ Missing translation');
      return NextResponse.json({ success: false, logs: logs.join('\n'), error: 'Missing translation' });
    }
    logs.push(`✅ Content: subject="${emailContent.subject.substring(0, 50)}..."`);

    // Test 4: Replace variables
    logs.push('\n4. Replacing variables...');
    const variables = {
      nome: 'Test User',
      link: 'https://test.vercel.app/auth/setup-password?token=abc123'
    };
    const subject = replaceVariables(emailContent.subject, variables);
    const htmlContent = replaceVariables(emailContent.body, variables);
    logs.push(`✅ Subject: ${subject}`);
    logs.push(`✅ HTML length: ${htmlContent.length} chars`);

    // Test 5: Send via Brevo
    logs.push('\n5. Sending via Brevo...');
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://shop.didieffeb2b.com';
    logs.push(`   Backend URL: ${backendUrl}`);

    const payload = {
      to: { email: 'test@example.com', name: 'Test User' },
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

    logs.push('   Payload prepared, calling Brevo API...');

    const emailResponse = await fetch(`${backendUrl}/admin/api/send-brevo-email.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    logs.push(`   Response status: ${emailResponse.status}`);

    if (emailResponse.ok) {
      const emailResult = await emailResponse.json();
      logs.push(`✅ Email sent! MessageId: ${emailResult.messageId}`);

      // Test 6: Log to Firestore
      logs.push('\n6. Logging to Firestore...');
      const { logEmail } = await import('@/lib/email-logger');
      await logEmail({
        to: 'test@example.com',
        subject,
        templateSlug: 'account-setup',
        status: 'success',
        messageId: emailResult.messageId,
        brevoResponse: emailResult,
      });
      logs.push('✅ Log saved to Firestore');

    } else {
      const errorText = await emailResponse.text();
      logs.push(`❌ Brevo error (${emailResponse.status}): ${errorText}`);

      // Still try to log the error
      logs.push('\n6. Logging error to Firestore...');
      const { logEmail } = await import('@/lib/email-logger');
      await logEmail({
        to: 'test@example.com',
        subject,
        templateSlug: 'account-setup',
        status: 'error',
        error: `HTTP ${emailResponse.status}: ${errorText}`,
      });
      logs.push('✅ Error log saved to Firestore');
    }

    return NextResponse.json({
      success: emailResponse.ok,
      logs: logs.join('\n'),
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logs.push(`\n❌ FATAL ERROR: ${error.message}`);
    logs.push(`Stack: ${error.stack}`);

    return NextResponse.json({
      success: false,
      logs: logs.join('\n'),
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

// Support both GET and POST
export async function GET(req: NextRequest) {
  return testEmailFlow(req);
}

export async function POST(req: NextRequest) {
  return testEmailFlow(req);
}
