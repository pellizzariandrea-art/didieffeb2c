// app/api/send-test-email/route.ts
// API route for sending test emails from admin panel
// Uses PHP proxy to avoid Brevo IP whitelist issues

import { NextRequest, NextResponse } from 'next/server';
import { getEmailConfig as getFirestoreConfig } from '@/lib/firebase/email-config';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    console.log('[Test Email] Sending test email to:', email);

    // Get email configuration from Firestore (or use defaults if not available)
    let config;
    try {
      config = await getFirestoreConfig();
      console.log('[Test Email] Using Firestore configuration');
    } catch (error) {
      console.log('[Test Email] Firestore not available, using default configuration');
      // Use default configuration
      config = {
        brevo: {
          senderEmail: process.env.BREVO_SENDER_EMAIL || 'noreply@didieffe.com',
          senderName: process.env.BREVO_SENDER_NAME || 'Di Dieffe B2B',
          replyToEmail: process.env.BREVO_REPLY_TO_EMAIL || 'apellizzari@didieffe.com',
          replyToName: process.env.BREVO_REPLY_TO_NAME || 'Di Dieffe Support',
        },
        templates: {
          b2c_welcome: {
            subject: 'Benvenuto su Di Dieffe B2B!',
            enabled: true,
          },
          b2b_confirmation: {
            subject: 'Richiesta Registrazione B2B Ricevuta - Di Dieffe',
            enabled: true,
          },
        },
      };
    }

    console.log('[Test Email] Using configuration:', config);

    // Prepare test email HTML content
    const htmlContent = `
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
          .test-badge {
            background-color: #fef3c7;
            border: 2px dashed #f59e0b;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
          .config-section {
            background-color: #f3f4f6;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            font-size: 14px;
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
          ${config.logo?.base64 ? `<img src="${config.logo.base64}" alt="Di Dieffe" class="logo">` : '<h1 style="color: #2563eb;">Di Dieffe B2B</h1>'}
        </div>

        <div class="content">
          <div class="test-badge">
            <h2 style="margin: 0; color: #f59e0b;">🧪 Email di Test</h2>
            <p style="margin: 10px 0 0 0;">Questa è un'email di test del sistema Brevo</p>
          </div>

          <h2 style="color: #2563eb;">Configurazione Email Funzionante! ✅</h2>

          <p>Se hai ricevuto questa email, significa che la configurazione di Brevo è corretta e funziona perfettamente.</p>

          <div class="config-section">
            <strong>📧 Configurazione Attuale:</strong><br><br>
            <strong>Mittente:</strong> ${config.brevo.senderName} &lt;${config.brevo.senderEmail}&gt;<br>
            <strong>Reply-To:</strong> ${config.brevo.replyToName} &lt;${config.brevo.replyToEmail}&gt;<br>
            <strong>Logo:</strong> ${config.logo?.base64 ? '✅ Personalizzato' : '❌ Non configurato'}<br>
            <strong>Template B2C:</strong> ${config.templates.b2c_welcome.enabled ? '✅ Attivo' : '❌ Disattivo'}<br>
            <strong>Template B2B:</strong> ${config.templates.b2b_confirmation.enabled ? '✅ Attivo' : '❌ Disattivo'}
          </div>

          <p><strong>Cosa puoi verificare:</strong></p>
          <ul>
            <li>Il logo aziendale viene visualizzato correttamente</li>
            <li>Il nome e l'email del mittente sono corretti</li>
            <li>Lo stile dell'email è professionale e coerente</li>
            <li>L'email non finisce nello spam</li>
          </ul>

          <p>Tutto sembra a posto? Ottimo! Ora puoi procedere con l'invio delle email ai tuoi clienti.</p>

          <p><strong>Il Team Di Dieffe</strong></p>
        </div>

        <div class="footer">
          <p>Di Dieffe B2B - Sistema di Email Transazionali</p>
          <p>Questa è un'email di test inviata dal pannello di amministrazione</p>
        </div>
      </body>
      </html>
    `;

    const textContent = `
🧪 EMAIL DI TEST - Sistema Brevo

Configurazione Email Funzionante! ✅

Se hai ricevuto questa email, significa che la configurazione di Brevo è corretta e funziona perfettamente.

📧 CONFIGURAZIONE ATTUALE:

Mittente: ${config.brevo.senderName} <${config.brevo.senderEmail}>
Reply-To: ${config.brevo.replyToName} <${config.brevo.replyToEmail}>
Logo: ${config.logo?.base64 ? '✅ Personalizzato' : '❌ Non configurato'}
Template B2C: ${config.templates.b2c_welcome.enabled ? '✅ Attivo' : '❌ Disattivo'}
Template B2B: ${config.templates.b2b_confirmation.enabled ? '✅ Attivo' : '❌ Disattivo'}

COSA PUOI VERIFICARE:
- Il logo aziendale viene visualizzato correttamente
- Il nome e l'email del mittente sono corretti
- Lo stile dell'email è professionale e coerente
- L'email non finisce nello spam

Tutto sembra a posto? Ottimo! Ora puoi procedere con l'invio delle email ai tuoi clienti.

Il Team Di Dieffe

---
Di Dieffe B2B - Sistema di Email Transazionali
Questa è un'email di test inviata dal pannello di amministrazione
    `;

    // Send test email via PHP proxy (to use SiteGround's static IP)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://shop.didieffeb2b.com';
    const proxyUrl = `${apiUrl}/admin/api/send-brevo-email.php`;

    console.log('[Test Email] Sending via PHP proxy:', proxyUrl);

    const proxyResponse = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: { email, name: 'Test User' },
        subject: '🧪 Test Email - Configurazione Brevo',
        htmlContent,
        textContent,
        sender: {
          email: config.brevo.senderEmail,
          name: config.brevo.senderName,
        },
        replyTo: {
          email: config.brevo.replyToEmail,
          name: config.brevo.replyToName,
        },
      }),
    });

    const result = await proxyResponse.json();

    if (!result.success) {
      throw new Error(result.error || 'Proxy error');
    }

    console.log('[Test Email] Email sent successfully via proxy:', result.messageId);

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: 'Email di test inviata con successo!',
      viaProxy: true,
      proxyUrl: apiUrl,
    });
  } catch (error: any) {
    console.error('[Test Email] Error sending test email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Errore nell\'invio dell\'email di test',
      },
      { status: 500 }
    );
  }
}
