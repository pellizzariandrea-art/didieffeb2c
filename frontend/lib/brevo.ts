// lib/brevo.ts
// Brevo Email Service Integration with Company Settings

import * as brevo from '@getbrevo/brevo';
import { getAppSettings } from './firebase/settings';
import { AppSettings, SupportedLanguage } from '@/types/settings';

// Initialize Brevo API
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY || ''
);

interface EmailRecipient {
  email: string;
  name: string;
}

interface SendEmailOptions {
  to: EmailRecipient;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

/**
 * Send transactional email via Brevo
 */
export async function sendEmail(options: SendEmailOptions, settings?: AppSettings) {
  try {
    // Get settings if not provided
    if (!settings) {
      settings = await getAppSettings();
    }

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: options.to.email, name: options.to.name }];
    sendSmtpEmail.sender = {
      name: settings.brevo.senderName,
      email: settings.brevo.senderEmail,
    };
    sendSmtpEmail.replyTo = {
      name: settings.brevo.replyToName,
      email: settings.brevo.replyToEmail,
    };
    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.htmlContent = options.htmlContent;
    if (options.textContent) {
      sendSmtpEmail.textContent = options.textContent;
    }

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ [Brevo] Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error('❌ [Brevo] Error sending email:', error);
    throw new Error(error.message || 'Failed to send email');
  }
}

/**
 * Get logo base64 from settings or use default
 */
function getLogoBase64(settings: AppSettings): string {
  // Use logo from settings if available
  if (settings.logo && settings.logo.base64) {
    return settings.logo.base64;
  }

  // Default logo fallback (current hardcoded logo)
  return 'data:image/png;base64,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';
}

/**
 * Replace template variables in email content
 */
function replaceVariables(
  content: string,
  variables: Record<string, string>
): string {
  let result = content;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  }

  return result;
}

/**
 * Generate email footer with company info
 */
function generateEmailFooter(settings: AppSettings): { html: string; text: string } {
  const { company } = settings;

  const html = `
    <div class="footer">
      <p><strong>${company.name}</strong></p>
      ${company.address ? `<p>${company.address}, ${company.postalCode} ${company.city} (${company.province})</p>` : ''}
      <p>
        ${company.phone ? `📞 ${company.phone}` : ''}
        ${company.phone && company.email ? ' | ' : ''}
        ${company.email ? `✉️ ${company.email}` : ''}
      </p>
      ${company.website ? `<p><a href="${company.website}" style="color: #2563eb;">${company.website}</a></p>` : ''}
      <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
        Hai ricevuto questa email perché sei registrato sul nostro sito
      </p>
    </div>
  `;

  const text = `
---
${company.name}
${company.address ? `${company.address}, ${company.postalCode} ${company.city} (${company.province})` : ''}
${company.phone ? `Tel: ${company.phone}` : ''}
${company.email ? `Email: ${company.email}` : ''}
${company.website || ''}

Hai ricevuto questa email perché sei registrato sul nostro sito
  `.trim();

  return { html, text };
}

/**
 * Send welcome email to new B2C customer
 */
export async function sendWelcomeEmailB2C(
  email: string,
  name: string,
  language: SupportedLanguage = 'it'
) {
  // Get settings
  const settings = await getAppSettings();

  // Check if B2C welcome email is enabled
  if (!settings.templates.b2c_welcome.enabled) {
    console.log('ℹ️ [Brevo] B2C welcome email is disabled, skipping');
    return { success: true, skipped: true };
  }

  const footer = generateEmailFooter(settings);

  // Get email content in specified language
  const emailContent = settings.templates.b2c_welcome.translations[language];

  // Variables to replace
  const variables = {
    name,
    email,
    company: settings.company.name,
    address: settings.company.address || '',
    phone: settings.company.phone || '',
  };

  // Replace variables in subject and body
  const subject = replaceVariables(emailContent.subject, variables);
  const bodyContent = replaceVariables(emailContent.body, variables);

  return sendEmail({
    to: { email, name },
    subject,
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 3px solid #2563eb;
            margin-bottom: 30px;
          }
          .logo {
            max-width: 200px;
            height: auto;
          }
          .content {
            padding: 20px 0;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${getLogoBase64(settings)}" alt="${settings.company.name}" class="logo">
        </div>

        <div class="content">
          ${bodyContent}
        </div>

        ${footer.html}
      </body>
      </html>
    `,
    textContent: bodyContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() + '\n\n' + footer.text,
  }, settings);
}

/**
 * Send registration confirmation email to new B2B company (pending approval)
 */
export async function sendB2BRegistrationConfirmation(
  email: string,
  companyName: string,
  language: SupportedLanguage = 'it'
) {
  // Get settings
  const settings = await getAppSettings();

  // Check if B2B confirmation email is enabled
  if (!settings.templates.b2b_confirmation.enabled) {
    console.log('ℹ️ [Brevo] B2B confirmation email is disabled, skipping');
    return { success: true, skipped: true };
  }

  const footer = generateEmailFooter(settings);

  // Get email content in specified language
  const emailContent = settings.templates.b2b_confirmation.translations[language];

  // Variables to replace
  const variables = {
    name: companyName,
    email,
    company: settings.company.name,
    userCompany: companyName,
    address: settings.company.address || '',
    phone: settings.company.phone || '',
  };

  // Replace variables in subject and body
  const subject = replaceVariables(emailContent.subject, variables);
  const bodyContent = replaceVariables(emailContent.body, variables);

  return sendEmail({
    to: { email, name: companyName },
    subject,
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 3px solid #2563eb;
            margin-bottom: 30px;
          }
          .logo {
            max-width: 200px;
            height: auto;
          }
          .content {
            padding: 20px 0;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${getLogoBase64(settings)}" alt="${settings.company.name}" class="logo">
        </div>

        <div class="content">
          ${bodyContent}
        </div>

        ${footer.html}
      </body>
      </html>
    `,
    textContent: bodyContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() + '\n\n' + footer.text,
  }, settings);
}
