// Debug endpoint to check email verification template
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { getEmailTemplatesServer } = await import('@/lib/firebase/email-templates-server');
    const { replaceVariables } = await import('@/types/email-template');

    const allTemplates = await getEmailTemplatesServer();
    const template = allTemplates.find(t => t.slug === 'email-verification');

    if (!template) {
      return NextResponse.json({
        error: 'Email verification template not found',
        availableTemplates: allTemplates.map(t => ({ slug: t.slug, enabled: t.enabled }))
      }, { status: 404 });
    }

    const itContent = template.translations['it'];

    if (!itContent) {
      return NextResponse.json({
        error: 'Italian translation not found',
        availableLanguages: Object.keys(template.translations || {})
      }, { status: 404 });
    }

    // Test replacement
    const testUrl = 'https://TESTVERCEL.app/verify-email/ABC123TOKEN';
    const variables = {
      nome: 'Test User',
      verificationUrl: testUrl,
      link: testUrl  // Template uses {{link}}
    };

    const replacedBody = replaceVariables(itContent.body, variables);

    return NextResponse.json({
      template: {
        slug: template.slug,
        enabled: template.enabled,
      },
      original: {
        subject: itContent.subject,
        bodyPreview: itContent.body.substring(0, 500) + '...',
        fullBody: itContent.body,
        hasVerificationUrl: itContent.body.includes('{{verificationUrl}}'),
        hasButton: itContent.body.includes('<a') && itContent.body.includes('button'),
      },
      replaced: {
        bodyPreview: replacedBody.substring(0, 500) + '...',
        fullBody: replacedBody,
        containsTestUrl: replacedBody.includes('TESTVERCEL'),
        containsToken: replacedBody.includes('ABC123TOKEN'),
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
