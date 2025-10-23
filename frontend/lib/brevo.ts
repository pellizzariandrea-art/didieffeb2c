// lib/brevo.ts
// Brevo Email Service Integration

import * as brevo from '@getbrevo/brevo';

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
export async function sendEmail(options: SendEmailOptions) {
  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: options.to.email, name: options.to.name }];
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME || 'Di Dieffe B2B',
      email: process.env.BREVO_SENDER_EMAIL || 'noreply@didieffe.com',
    };
    sendSmtpEmail.replyTo = {
      name: process.env.BREVO_REPLY_TO_NAME || 'Di Dieffe Support',
      email: process.env.BREVO_REPLY_TO_EMAIL || 'apellizzari@didieffe.com',
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
 * Send welcome email to new B2C customer
 */
export async function sendWelcomeEmailB2C(email: string, name: string) {
  return sendEmail({
    to: { email, name },
    subject: 'Benvenuto su Di Dieffe B2B!',
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
            padding: 12px 30px;
            background-color: #2563eb;
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
          }
          .highlight {
            background-color: #f3f4f6;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="https://shop.didieffeb2b.com/logo_ddf.png" alt="Di Dieffe" class="logo">
        </div>

        <div class="content">
          <h2 style="color: #2563eb;">Ciao ${name}!</h2>

          <p>Grazie per esserti registrato su <strong>Di Dieffe B2B</strong>.</p>

          <p>Il tuo account è <strong>attivo</strong> e puoi iniziare subito a:</p>

          <div class="highlight">
            ✅ Sfogliare il nostro catalogo completo<br>
            ✅ Aggiungere prodotti al carrello<br>
            ✅ Effettuare ordini in modo semplice e veloce<br>
            ✅ Salvare i tuoi prodotti preferiti
          </div>

          <p>Non dimenticare di verificare la tua email per completare la registrazione.</p>

          <p style="text-align: center;">
            <a href="https://shop.didieffeb2b.com" class="button">Inizia a Fare Acquisti</a>
          </p>

          <p>Se hai domande o hai bisogno di assistenza, non esitare a contattarci rispondendo a questa email.</p>

          <p>Buono shopping!</p>
          <p><strong>Il Team Di Dieffe</strong></p>
        </div>

        <div class="footer">
          <p>Di Dieffe B2B - Il tuo partner per persiane e scuri di qualità</p>
          <p>Hai ricevuto questa email perché ti sei registrato su shop.didieffeb2b.com</p>
        </div>
      </body>
      </html>
    `,
    textContent: `
Ciao ${name}!

Grazie per esserti registrato su Di Dieffe B2B.

Il tuo account è attivo e puoi iniziare subito a:
- Sfogliare il nostro catalogo completo
- Aggiungere prodotti al carrello
- Effettuare ordini in modo semplice e veloce
- Salvare i tuoi prodotti preferiti

Non dimenticare di verificare la tua email per completare la registrazione.

Visita: https://shop.didieffeb2b.com

Se hai domande o hai bisogno di assistenza, non esitare a contattarci rispondendo a questa email.

Buono shopping!
Il Team Di Dieffe

---
Di Dieffe B2B - Il tuo partner per persiane e scuri di qualità
Hai ricevuto questa email perché ti sei registrato su shop.didieffeb2b.com
    `,
  });
}

/**
 * Send registration confirmation email to new B2B company (pending approval)
 */
export async function sendB2BRegistrationConfirmation(email: string, companyName: string) {
  return sendEmail({
    to: { email, name: companyName },
    subject: 'Richiesta Registrazione B2B Ricevuta - Di Dieffe',
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
          .alert {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
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
          <img src="https://shop.didieffeb2b.com/logo_ddf.png" alt="Di Dieffe" class="logo">
        </div>

        <div class="content">
          <h2 style="color: #2563eb;">Ciao ${companyName}!</h2>

          <p>Grazie per aver richiesto la registrazione come <strong>cliente Business</strong> su Di Dieffe B2B.</p>

          <div class="alert">
            <strong>⏳ Richiesta in Attesa di Approvazione</strong><br>
            Il nostro team sta verificando i dati della tua azienda. Riceverai una conferma via email appena il tuo account sarà attivato.
          </div>

          <p><strong>Cosa succede ora?</strong></p>
          <ol>
            <li>Verificheremo i dati della tua azienda</li>
            <li>Attiveremo il tuo account B2B con condizioni dedicate</li>
            <li>Riceverai un'email di conferma (di solito entro 24-48 ore)</li>
          </ol>

          <p>Non dimenticare di verificare la tua email cliccando sul link che ti abbiamo inviato.</p>

          <p>Se hai urgenze o domande, contattaci rispondendo a questa email.</p>

          <p>A presto!</p>
          <p><strong>Il Team Di Dieffe</strong></p>
        </div>

        <div class="footer">
          <p>Di Dieffe B2B - Soluzioni professionali per persiane e scuri</p>
          <p>Hai ricevuto questa email perché hai richiesto un account Business</p>
        </div>
      </body>
      </html>
    `,
    textContent: `
Ciao ${companyName}!

Grazie per aver richiesto la registrazione come cliente Business su Di Dieffe B2B.

⏳ RICHIESTA IN ATTESA DI APPROVAZIONE

Il nostro team sta verificando i dati della tua azienda. Riceverai una conferma via email appena il tuo account sarà attivato.

Cosa succede ora?
1. Verificheremo i dati della tua azienda
2. Attiveremo il tuo account B2B con condizioni dedicate
3. Riceverai un'email di conferma (di solito entro 24-48 ore)

Non dimenticare di verificare la tua email cliccando sul link che ti abbiamo inviato.

Se hai urgenze o domande, contattaci rispondendo a questa email.

A presto!
Il Team Di Dieffe

---
Di Dieffe B2B - Soluzioni professionali per persiane e scuri
Hai ricevuto questa email perché hai richiesto un account Business
    `,
  });
}
