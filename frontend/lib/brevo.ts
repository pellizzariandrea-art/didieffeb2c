// lib/brevo.ts
// Brevo Email Service Integration with Company Settings
// Uses PHP proxy on SiteGround (static IP) to avoid Brevo IP whitelist issues

import { getAppSettingsServer } from './firebase/settings-server';
import { AppSettings, SupportedLanguage } from '@/types/settings';
import { getEmailTemplatesServer } from './firebase/email-templates-server';
import { replaceVariables } from '@/types/email-template';
import { createVerificationToken } from './firebase/email-verification';

// Brevo proxy endpoint (PHP on SiteGround with whitelisted IP)
const BREVO_PROXY_URL = process.env.NEXT_PUBLIC_API_URL + '/admin/api/send-brevo-email.php';

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
 * Send transactional email via Brevo (using PHP proxy)
 */
export async function sendEmail(options: SendEmailOptions, settings?: AppSettings) {
  try {
    // Get settings if not provided
    if (!settings) {
      settings = await getAppSettingsServer();
    }

    // Prepare payload for PHP proxy
    const payload = {
      to: { email: options.to.email, name: options.to.name },
      subject: options.subject,
      htmlContent: options.htmlContent,
      sender: {
        name: settings.brevo.senderName,
        email: settings.brevo.senderEmail,
      },
      replyTo: {
        name: settings.brevo.replyToName,
        email: settings.brevo.replyToEmail,
      },
    };

    if (options.textContent) {
      payload.textContent = options.textContent;
    }

    // Send via PHP proxy
    console.log('📤 [Brevo] Sending to proxy:', BREVO_PROXY_URL);
    const response = await fetch(BREVO_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('📥 [Brevo] Proxy response status:', response.status);
    console.log('📥 [Brevo] Proxy response:', responseText.substring(0, 200));

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ [Brevo] Failed to parse response as JSON');
      throw new Error(`Proxy returned invalid JSON: ${responseText.substring(0, 100)}`);
    }

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to send email via proxy');
    }

    console.log('✅ [Brevo] Email sent successfully via proxy:', result.messageId);
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
 * Send registration confirmation email to new B2B company (pending approval)
 */
export async function sendB2BRegistrationConfirmation(
  email: string,
  companyName: string,
  language: SupportedLanguage = 'it'
) {
  // Get settings
  const settings = await getAppSettingsServer();

  // Load all email templates from Firestore (server-side)
  const allTemplates = await getEmailTemplatesServer();

  // Find authentication template for B2B
  const template = allTemplates.find(
    t => t.category === 'authentication' &&
         t.enabled &&
         t.targetAudience?.includes('b2b')
  );

  if (!template) {
    console.log('ℹ️ [Brevo] No enabled B2B authentication template found, skipping');
    return { success: true, skipped: true };
  }

  const footer = generateEmailFooter(settings);

  // Get email content in specified language
  const emailContent = template.translations[language];

  if (!emailContent || !emailContent.subject || !emailContent.body) {
    console.log(`⚠️ [Brevo] B2B template missing translation for ${language}, skipping`);
    return { success: true, skipped: true };
  }

  // Variables to replace (based on template.variables)
  const variables: Record<string, string> = {
    ragioneSociale: companyName,
    email,
    company: settings.company.name,
    address: settings.company.address || '',
    phone: settings.company.phone || '',
    firma: settings.emailSignature?.translations?.[language] || settings.emailSignature?.translations?.it || '',
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

/**
 * Send email verification link to user
 */
export async function sendVerificationEmail(
  userId: string,
  email: string,
  name: string,
  language: SupportedLanguage = 'it'
) {
  try {
    // Get settings
    const settings = await getAppSettingsServer();

    // Load all email templates from Firestore (server-side)
    const allTemplates = await getEmailTemplatesServer();

    // Find email verification template
    const template = allTemplates.find(
      t => t.slug === 'email-verification' && t.enabled
    );

    if (!template) {
      console.log('⚠️ [Brevo] No enabled email verification template found, using fallback');
      // Use fallback if no template found
      return sendVerificationEmailFallback(userId, email, name, language, settings);
    }

    // Create verification token
    const token = await createVerificationToken(userId, email);

    // Build verification URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002';
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

    const footer = generateEmailFooter(settings);

    // Get email content in specified language
    const emailContent = template.translations[language];

    if (!emailContent || !emailContent.subject || !emailContent.body) {
      console.log(`⚠️ [Brevo] Email verification template missing translation for ${language}, using fallback`);
      return sendVerificationEmailFallback(userId, email, name, language, settings);
    }

    // Variables to replace
    const variables: Record<string, string> = {
      nome: name,
      email,
      verificationUrl,
      company: settings.company.name,
      address: settings.company.address || '',
      phone: settings.company.phone || '',
      firma: settings.emailSignature?.translations?.[language] || settings.emailSignature?.translations?.it || '',
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
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #2563eb;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: 600;
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
      textContent: bodyContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() + '\n\n' + verificationUrl + '\n\n' + footer.text,
    }, settings);
  } catch (error) {
    console.error('❌ [Brevo] Error sending verification email:', error);
    throw error;
  }
}

/**
 * Fallback function to send verification email without template
 */
async function sendVerificationEmailFallback(
  userId: string,
  email: string,
  name: string,
  language: SupportedLanguage,
  settings: AppSettings
) {
  // Create verification token
  const token = await createVerificationToken(userId, email);

  // Build verification URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002';
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

  const footer = generateEmailFooter(settings);

  // Multilingual content
  const content: Record<SupportedLanguage, { subject: string; body: string; button: string }> = {
    it: {
      subject: 'Verifica il tuo indirizzo email',
      body: `<p>Ciao ${name},</p><p>Grazie per esserti registrato! Per completare la registrazione, clicca sul pulsante qui sotto per verificare il tuo indirizzo email:</p>`,
      button: 'Verifica Email'
    },
    en: {
      subject: 'Verify your email address',
      body: `<p>Hello ${name},</p><p>Thank you for registering! To complete your registration, click the button below to verify your email address:</p>`,
      button: 'Verify Email'
    },
    de: {
      subject: 'Bestätige deine E-Mail-Adresse',
      body: `<p>Hallo ${name},</p><p>Vielen Dank für deine Registrierung! Um deine Registrierung abzuschließen, klicke auf die Schaltfläche unten, um deine E-Mail-Adresse zu bestätigen:</p>`,
      button: 'E-Mail bestätigen'
    },
    fr: {
      subject: 'Vérifiez votre adresse e-mail',
      body: `<p>Bonjour ${name},</p><p>Merci de vous être inscrit! Pour compléter votre inscription, cliquez sur le bouton ci-dessous pour vérifier votre adresse e-mail:</p>`,
      button: 'Vérifier l\'e-mail'
    },
    es: {
      subject: 'Verifica tu dirección de correo electrónico',
      body: `<p>Hola ${name},</p><p>¡Gracias por registrarte! Para completar tu registro, haz clic en el botón de abajo para verificar tu dirección de correo electrónico:</p>`,
      button: 'Verificar correo'
    },
    pt: {
      subject: 'Verifique seu endereço de e-mail',
      body: `<p>Olá ${name},</p><p>Obrigado por se registrar! Para completar seu registro, clique no botão abaixo para verificar seu endereço de e-mail:</p>`,
      button: 'Verificar e-mail'
    },
    hr: {
      subject: 'Potvrdite svoju email adresu',
      body: `<p>Pozdrav ${name},</p><p>Hvala što ste se registrirali! Da dovršite registraciju, kliknite na gumb ispod kako biste potvrdili svoju email adresu:</p>`,
      button: 'Potvrdi email'
    },
    sl: {
      subject: 'Potrdite svoj e-poštni naslov',
      body: `<p>Pozdravljeni ${name},</p><p>Hvala za registracijo! Za dokončanje registracije kliknite spodnji gumb za potrditev vašega e-poštnega naslova:</p>`,
      button: 'Potrdi e-pošto'
    },
    el: {
      subject: 'Επαληθεύστε τη διεύθυνση email σας',
      body: `<p>Γεια σου ${name},</p><p>Ευχαριστούμε που εγγραφήκατε! Για να ολοκληρώσετε την εγγραφή σας, κάντε κλικ στο παρακάτω κουμπί για να επαληθεύσετε τη διεύθυνση email σας:</p>`,
      button: 'Επαλήθευση email'
    }
  };

  const { subject, body, button } = content[language];

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
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #2563eb;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
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
          ${body}
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">${button}</a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            ${language === 'it' ? 'Se il pulsante non funziona, copia e incolla questo link nel tuo browser:' :
              language === 'en' ? 'If the button doesn\'t work, copy and paste this link into your browser:' :
              language === 'de' ? 'Wenn die Schaltfläche nicht funktioniert, kopieren Sie diesen Link und fügen Sie ihn in Ihren Browser ein:' :
              language === 'fr' ? 'Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur:' :
              language === 'es' ? 'Si el botón no funciona, copia y pega este enlace en tu navegador:' :
              language === 'pt' ? 'Se o botão não funcionar, copie e cole este link no seu navegador:' :
              language === 'hr' ? 'Ako gumb ne radi, kopirajte i zalijepite ovu vezu u svoj preglednik:' :
              language === 'sl' ? 'Če gumb ne deluje, kopirajte in prilepite to povezavo v svoj brskalnik:' :
              'Εάν το κουμπί δεν λειτουργεί, αντιγράψτε και επικολλήστε αυτόν τον σύνδεσμο στο πρόγραμμα περιήγησής σας:'}
          </p>
          <p style="color: #6b7280; font-size: 12px; word-break: break-all;">
            ${verificationUrl}
          </p>
        </div>

        ${footer.html}
      </body>
      </html>
    `,
    textContent: `${body}\n\n${verificationUrl}\n\n${footer.text}`,
  }, settings);
}
