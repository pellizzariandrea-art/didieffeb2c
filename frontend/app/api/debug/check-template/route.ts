// Debug endpoint to check email template content
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { getEmailTemplatesServer } = await import('@/lib/firebase/email-templates-server');
    const { replaceVariables } = await import('@/types/email-template');

    const allTemplates = await getEmailTemplatesServer();
    const template = allTemplates.find(t => t.slug === 'account-setup');

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const itContent = template.translations['it'];

    // Test replacement
    const variables = {
      nome: 'Test User',
      link: 'https://TESTLINK.com/auth/setup-password?token=ABC123XYZ'
    };

    const replacedBody = replaceVariables(itContent.body, variables);

    return NextResponse.json({
      template: {
        slug: template.slug,
        enabled: template.enabled,
      },
      original: {
        subject: itContent.subject,
        body: itContent.body,
      },
      replaced: {
        body: replacedBody,
        containsTestLink: replacedBody.includes('TESTLINK'),
        containsToken: replacedBody.includes('ABC123XYZ'),
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
