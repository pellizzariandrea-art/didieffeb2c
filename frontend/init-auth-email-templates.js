// init-auth-email-templates.js
// Script to initialize authentication email templates in Firestore

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'admin', 'didieffeb2b-ecommerce-firebase-adminsdk-fbsvc-fbd636cc08.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const authTemplates = [
  {
    slug: 'email-verification',
    name: 'Verifica Email - Post Registrazione',
    description: 'Email inviata dopo la registrazione per verificare l\'indirizzo email',
    category: 'authentication',
    targetAudience: ['b2b', 'b2c'],
    variables: [
      {
        name: 'nome',
        label: 'Nome/Ragione Sociale',
        description: 'Nome utente o ragione sociale dell\'azienda',
        required: true,
        example: 'Mario Rossi'
      },
      {
        name: 'link',
        label: 'Link Verifica',
        description: 'URL per verificare l\'email',
        required: true,
        example: 'https://shop.example.com/verify-email?token=...'
      }
    ],
    enabled: true,
    translations: {
      it: {
        subject: 'Verifica la tua email - Di Dieffe B2B',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">✉️ Verifica la tua email</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Ciao {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Grazie per esserti registrato! Per completare la registrazione, verifica la tua email cliccando sul pulsante:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Verifica Email
      </a>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #856404;">
        <strong>⚠️ Questo link è valido per 24 ore.</strong><br>
        Se non hai effettuato questa registrazione, ignora questa email.
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">Cordiali saluti,<br>Il team Di Dieffe B2B</p>
  </div>
</div>`
      },
      en: {
        subject: 'Verify Your Email - Di Dieffe B2B',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">✉️ Verify Your Email</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hello {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Thank you for registering! To complete your registration, verify your email by clicking the button:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Verify Email
      </a>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #856404;">
        <strong>⚠️ This link is valid for 24 hours.</strong><br>
        If you did not request this, please ignore this email.
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">Best regards,<br>The Di Dieffe B2B team</p>
  </div>
</div>`
      },
      de: {
        subject: 'E-Mail bestätigen - Di Dieffe B2B',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">✉️ E-Mail bestätigen</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hallo {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Vielen Dank für Ihre Registrierung! Um die Registrierung abzuschließen, bestätigen Sie Ihre E-Mail, indem Sie auf die Schaltfläche klicken:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        E-Mail bestätigen
      </a>
    </div>

    <p style="font-size: 14px; color: #666;">Mit freundlichen Grüßen,<br>Das Di Dieffe B2B Team</p>
  </div>
</div>`
      },
      fr: {
        subject: 'Vérifiez votre email - Di Dieffe B2B',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">✉️ Vérifiez votre email</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Bonjour {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Merci de vous être inscrit ! Pour compléter votre inscription, vérifiez votre email en cliquant sur le bouton :</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Vérifier l'email
      </a>
    </div>

    <p style="font-size: 14px; color: #666;">Cordialement,<br>L'équipe Di Dieffe B2B</p>
  </div>
</div>`
      },
      es: {
        subject: 'Verifica tu email - Di Dieffe B2B',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">✉️ Verifica tu email</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hola {{nome}},</p>

    <p style="font-size: 14px; color: #666;">¡Gracias por registrarte! Para completar tu registro, verifica tu email haciendo clic en el botón:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Verificar email
      </a>
    </div>

    <p style="font-size: 14px; color: #666;">Saludos cordiales,<br>El equipo de Di Dieffe B2B</p>
  </div>
</div>`
      },
      pt: {
        subject: 'Verifique seu email - Di Dieffe B2B',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">✉️ Verifique seu email</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Olá {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Obrigado por se registrar! Para concluir seu registro, verifique seu email clicando no botão:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Verificar email
      </a>
    </div>

    <p style="font-size: 14px; color: #666;">Atenciosamente,<br>A equipe Di Dieffe B2B</p>
  </div>
</div>`
      },
      hr: {
        subject: 'Potvrdite svoj email - Di Dieffe B2B',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">✉️ Potvrdite svoj email</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Pozdrav {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Hvala što ste se registrirali! Da dovršite registraciju, potvrdite svoj email klikom na gumb:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Potvrdi email
      </a>
    </div>

    <p style="font-size: 14px; color: #666;">S poštovanjem,<br>Tim Di Dieffe B2B</p>
  </div>
</div>`
      },
      sl: {
        subject: 'Potrdite svoj email - Di Dieffe B2B',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">✉️ Potrdite svoj email</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Pozdravljeni {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Hvala za registracijo! Da zaključite registracijo, potrdite svoj email s klikom na gumb:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Potrdi email
      </a>
    </div>

    <p style="font-size: 14px; color: #666;">Lep pozdrav,<br>Ekipa Di Dieffe B2B</p>
  </div>
</div>`
      },
      el: {
        subject: 'Επαληθεύστε το email σας - Di Dieffe B2B',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">✉️ Επαληθεύστε το email σας</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Γεια σου {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Ευχαριστούμε για την εγγραφή σας! Για να ολοκληρώσετε την εγγραφή, επαληθεύστε το email σας κάνοντας κλικ στο κουμπί:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Επαλήθευση email
      </a>
    </div>

    <p style="font-size: 14px; color: #666;">Με εκτίμηση,<br>Η ομάδα Di Dieffe B2B</p>
  </div>
</div>`
      }
    }
  },

  // Reset Password Template
  {
    slug: 'reset-password',
    name: 'Reset Password',
    description: 'Email per reimpostare la password dimenticata',
    category: 'authentication',
    targetAudience: ['b2b', 'b2c'],
    variables: [
      {
        name: 'nome',
        label: 'Nome/Ragione Sociale',
        description: 'Nome utente o ragione sociale dell\'azienda',
        required: true,
        example: 'Mario Rossi'
      },
      {
        name: 'link',
        label: 'Link Reset Password',
        description: 'URL per reimpostare la password',
        required: true,
        example: 'https://shop.example.com/reset-password?token=...'
      }
    ],
    enabled: true,
    translations: {
      it: {
        subject: 'Reset Password - Di Dieffe B2B',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🔐 Reset Password</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Ciao {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Hai richiesto di reimpostare la password del tuo account. Clicca sul pulsante qui sotto per procedere:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Reimposta Password
      </a>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #856404;">
        <strong>⚠️ Se non hai richiesto questa operazione, ignora questa email.</strong><br>
        Il link scadrà tra 1 ora.
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">Cordiali saluti,<br>Il team Di Dieffe B2B</p>
  </div>
</div>`
      },
      en: {
        subject: 'Password Reset - Di Dieffe B2B',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🔐 Password Reset</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hello {{nome}},</p>

    <p style="font-size: 14px; color: #666;">You have requested to reset your account password. Click the button below to proceed:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Reset Password
      </a>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #856404;">
        <strong>⚠️ If you did not request this, please ignore this email.</strong><br>
        The link will expire in 1 hour.
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">Best regards,<br>The Di Dieffe B2B team</p>
  </div>
</div>`
      },
      de: {
        subject: 'Passwort zurücksetzen - Di Dieffe B2B',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🔐 Passwort zurücksetzen</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hallo {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Sie haben eine Zurücksetzung Ihres Passworts angefordert. Klicken Sie auf die Schaltfläche unten, um fortzufahren:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Passwort zurücksetzen
      </a>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #856404;">
        <strong>⚠️ Wenn Sie dies nicht angefordert haben, ignorieren Sie diese E-Mail.</strong><br>
        Der Link läuft in 1 Stunde ab.
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">Mit freundlichen Grüßen,<br>Das Di Dieffe B2B Team</p>
  </div>
</div>`
      },
      fr: {
        subject: 'Réinitialisation du mot de passe - Di Dieffe B2B',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🔐 Réinitialisation du mot de passe</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Bonjour {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Vous avez demandé à réinitialiser le mot de passe de votre compte. Cliquez sur le bouton ci-dessous pour continuer:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Réinitialiser le mot de passe
      </a>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #856404;">
        <strong>⚠️ Si vous n\'avez pas demandé cela, ignorez cet email.</strong><br>
        Le lien expirera dans 1 heure.
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">Cordialement,<br>L\'équipe Di Dieffe B2B</p>
  </div>
</div>`
      },
      es: {
        subject: 'Restablecer contraseña - Di Dieffe B2B',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🔐 Restablecer contraseña</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hola {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Has solicitado restablecer la contraseña de tu cuenta. Haz clic en el botón de abajo para continuar:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Restablecer contraseña
      </a>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #856404;">
        <strong>⚠️ Si no solicitaste esto, ignora este correo.</strong><br>
        El enlace caducará en 1 hora.
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">Saludos cordiales,<br>El equipo de Di Dieffe B2B</p>
  </div>
</div>`
      },
      pt: {
        subject: 'Redefinir senha - Di Dieffe B2B',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🔐 Redefinir senha</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Olá {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Você solicitou a redefinição da senha da sua conta. Clique no botão abaixo para prosseguir:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Redefinir senha
      </a>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #856404;">
        <strong>⚠️ Se você não solicitou isso, ignore este email.</strong><br>
        O link expirará em 1 hora.
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">Atenciosamente,<br>A equipe Di Dieffe B2B</p>
  </div>
</div>`
      },
      hr: {
        subject: 'Resetiranje lozinke - Di Dieffe B2B',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🔐 Resetiranje lozinke</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Pozdrav {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Zatražili ste resetiranje lozinke vašeg računa. Kliknite na gumb ispod za nastavak:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Resetiraj lozinku
      </a>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #856404;">
        <strong>⚠️ Ako niste zatražili ovo, zanemarite ovu poruku.</strong><br>
        Link će isteći za 1 sat.
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">S poštovanjem,<br>Tim Di Dieffe B2B</p>
  </div>
</div>`
      },
      sl: {
        subject: 'Ponastavitev gesla - Di Dieffe B2B',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🔐 Ponastavitev gesla</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Pozdravljeni {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Zahtevali ste ponastavitev gesla za vaš račun. Kliknite na spodnji gumb za nadaljevanje:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Ponastavi geslo
      </a>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #856404;">
        <strong>⚠️ Če tega niste zahtevali, prezrite to sporočilo.</strong><br>
        Povezava bo potekla čez 1 uro.
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">Lep pozdrav,<br>Ekipa Di Dieffe B2B</p>
  </div>
</div>`
      },
      el: {
        subject: 'Επαναφορά κωδικού - Di Dieffe B2B',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🔐 Επαναφορά κωδικού</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Γεια σου {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Ζητήσατε να επαναφέρετε τον κωδικό πρόσβασης του λογαριασμού σας. Κάντε κλικ στο παρακάτω κουμπί για να συνεχίσετε:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Επαναφορά κωδικού
      </a>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #856404;">
        <strong>⚠️ Εάν δεν ζητήσατε αυτό, αγνοήστε αυτό το email.</strong><br>
        Ο σύνδεσμος θα λήξει σε 1 ώρα.
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">Με εκτίμηση,<br>Η ομάδα Di Dieffe B2B</p>
  </div>
</div>`
      }
    }
  },

  // Account Setup Template (sent when admin creates user)
  {
    slug: 'account-setup',
    name: 'Configurazione Account - Imposta Password',
    description: 'Email inviata quando l\'admin crea un nuovo utente, per impostare la password',
    category: 'authentication',
    targetAudience: ['b2b', 'b2c'],
    variables: [
      {
        name: 'nome',
        label: 'Nome/Ragione Sociale',
        description: 'Nome utente o ragione sociale dell\'azienda',
        required: true,
        example: 'Mario Rossi'
      },
      {
        name: 'link',
        label: 'Link Imposta Password',
        description: 'URL per impostare la password',
        required: true,
        example: 'https://shop.example.com/setup-password?token=...'
      }
    ],
    enabled: true,
    translations: {
      it: {
        subject: 'Benvenuto su Di Dieffe B2B - Imposta la tua password',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🎉 Benvenuto su Di Dieffe B2B</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Ciao {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Il tuo account è stato creato! Per iniziare, devi impostare la tua password personale. Clicca sul pulsante qui sotto:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Imposta Password
      </a>
    </div>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #1e40af;">
        <strong>ℹ️ Questo link è valido per 1 ora.</strong><br>
        Se scade, puoi richiedere un nuovo link dalla pagina di login.
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">Benvenuto nel nostro negozio!<br>Il team Di Dieffe B2B</p>
  </div>
</div>`
      },
      en: {
        subject: 'Welcome to Di Dieffe B2B - Set Your Password',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🎉 Welcome to Di Dieffe B2B</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hello {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Your account has been created! To get started, you need to set your personal password. Click the button below:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Set Password
      </a>
    </div>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #1e40af;">
        <strong>ℹ️ This link is valid for 1 hour.</strong><br>
        If it expires, you can request a new link from the login page.
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">Welcome to our store!<br>The Di Dieffe B2B team</p>
  </div>
</div>`
      },
      de: {
        subject: 'Willkommen bei Di Dieffe B2B - Passwort festlegen',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🎉 Willkommen bei Di Dieffe B2B</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hallo {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Ihr Konto wurde erstellt! Um zu beginnen, müssen Sie Ihr persönliches Passwort festlegen. Klicken Sie auf die Schaltfläche unten:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Passwort festlegen
      </a>
    </div>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #1e40af;">
        <strong>ℹ️ Dieser Link ist 1 Stunde gültig.</strong><br>
        Wenn er abläuft, können Sie einen neuen Link von der Login-Seite anfordern.
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">Willkommen in unserem Shop!<br>Das Di Dieffe B2B Team</p>
  </div>
</div>`
      },
      fr: {
        subject: 'Bienvenue sur Di Dieffe B2B - Définissez votre mot de passe',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🎉 Bienvenue sur Di Dieffe B2B</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Bonjour {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Votre compte a été créé! Pour commencer, vous devez définir votre mot de passe personnel. Cliquez sur le bouton ci-dessous:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Définir le mot de passe
      </a>
    </div>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #1e40af;">
        <strong>ℹ️ Ce lien est valide pendant 1 heure.</strong><br>
        S\'il expire, vous pouvez demander un nouveau lien depuis la page de connexion.
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">Bienvenue dans notre boutique!<br>L\'équipe Di Dieffe B2B</p>
  </div>
</div>`
      },
      es: {
        subject: 'Bienvenido a Di Dieffe B2B - Establece tu contraseña',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🎉 Bienvenido a Di Dieffe B2B</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hola {{nome}},</p>

    <p style="font-size: 14px; color: #666;">¡Tu cuenta ha sido creada! Para empezar, debes establecer tu contraseña personal. Haz clic en el botón de abajo:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Establecer contraseña
      </a>
    </div>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #1e40af;">
        <strong>ℹ️ Este enlace es válido durante 1 hora.</strong><br>
        Si caduca, puedes solicitar un nuevo enlace desde la página de inicio de sesión.
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">¡Bienvenido a nuestra tienda!<br>El equipo de Di Dieffe B2B</p>
  </div>
</div>`
      },
      pt: {
        subject: 'Bem-vindo ao Di Dieffe B2B - Defina sua senha',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🎉 Bem-vindo ao Di Dieffe B2B</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Olá {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Sua conta foi criada! Para começar, você precisa definir sua senha pessoal. Clique no botão abaixo:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Definir senha
      </a>
    </div>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #1e40af;">
        <strong>ℹ️ Este link é válido por 1 hora.</strong><br>
        Se expirar, você pode solicitar um novo link na página de login.
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">Bem-vindo à nossa loja!<br>A equipe Di Dieffe B2B</p>
  </div>
</div>`
      },
      hr: {
        subject: 'Dobrodošli u Di Dieffe B2B - Postavite lozinku',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🎉 Dobrodošli u Di Dieffe B2B</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Pozdrav {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Vaš račun je kreiran! Za početak morate postaviti svoju osobnu lozinku. Kliknite na gumb ispod:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Postavi lozinku
      </a>
    </div>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #1e40af;">
        <strong>ℹ️ Ova veza je valjana 1 sat.</strong><br>
        Ako istekne, možete zatražiti novu vezu sa stranice za prijavu.
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">Dobrodošli u našu trgovinu!<br>Tim Di Dieffe B2B</p>
  </div>
</div>`
      },
      sl: {
        subject: 'Dobrodošli v Di Dieffe B2B - Nastavite geslo',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🎉 Dobrodošli v Di Dieffe B2B</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Pozdravljeni {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Vaš račun je bil ustvarjen! Za začetek morate nastaviti svoje osebno geslo. Kliknite na spodnji gumb:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Nastavi geslo
      </a>
    </div>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #1e40af;">
        <strong>ℹ️ Ta povezava je veljavna 1 uro.</strong><br>
        Če poteče, lahko zahtevate novo povezavo na strani za prijavo.
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">Dobrodošli v naši trgovini!<br>Ekipa Di Dieffe B2B</p>
  </div>
</div>`
      },
      el: {
        subject: 'Καλώς ήρθατε στο Di Dieffe B2B - Ορίστε τον κωδικό σας',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🎉 Καλώς ήρθατε στο Di Dieffe B2B</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Γεια σου {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Ο λογαριασμός σας δημιουργήθηκε! Για να ξεκινήσετε, πρέπει να ορίσετε τον προσωπικό σας κωδικό πρόσβασης. Κάντε κλικ στο παρακάτω κουμπί:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{link}}" style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Ορισμός κωδικού
      </a>
    </div>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #1e40af;">
        <strong>ℹ️ Αυτός ο σύνδεσμος ισχύει για 1 ώρα.</strong><br>
        Εάν λήξει, μπορείτε να ζητήσετε νέο σύνδεσμο από τη σελίδα σύνδεσης.
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">Καλώς ήρθατε στο κατάστημά μας!<br>Η ομάδα Di Dieffe B2B</p>
  </div>
</div>`
      }
    }
  },

  // Welcome Email (post-verification, unified for B2B/B2C)
  {
    slug: 'welcome-email',
    name: 'Email di Benvenuto - Post Verifica',
    description: 'Email di benvenuto inviata dopo la verifica email (B2B e B2C)',
    category: 'authentication',
    targetAudience: ['b2b', 'b2c'],
    variables: [
      {
        name: 'nome',
        label: 'Nome/Ragione Sociale',
        description: 'Nome utente o ragione sociale dell\'azienda',
        required: true,
        example: 'Mario Rossi'
      }
    ],
    enabled: true,
    translations: {
      it: {
        subject: 'Benvenuto in Di Dieffe B2B!',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🎉 Benvenuto!</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Ciao {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Grazie per aver verificato il tuo account! Ora puoi accedere al nostro catalogo e iniziare a esplorare i nostri prodotti.</p>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #1e40af;">
        <strong>💡 Cosa puoi fare ora:</strong><br>
        • Sfoglia il nostro catalogo completo<br>
        • Richiedi preventivi personalizzati<br>
        • Contattaci per assistenza
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">Siamo qui per aiutarti!<br>Il team Di Dieffe B2B</p>
  </div>
</div>`
      },
      en: {
        subject: 'Welcome to Di Dieffe B2B!',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🎉 Welcome!</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hello {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Thank you for verifying your account! You can now access our catalog and start exploring our products.</p>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #1e40af;">
        <strong>💡 What you can do now:</strong><br>
        • Browse our complete catalog<br>
        • Request personalized quotes<br>
        • Contact us for assistance
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">We\'re here to help!<br>The Di Dieffe B2B team</p>
  </div>
</div>`
      },
      de: {
        subject: 'Willkommen bei Di Dieffe B2B!',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🎉 Willkommen!</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hallo {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Vielen Dank für die Verifizierung Ihres Kontos! Sie können jetzt auf unseren Katalog zugreifen und unsere Produkte erkunden.</p>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #1e40af;">
        <strong>💡 Was Sie jetzt tun können:</strong><br>
        • Durchsuchen Sie unseren vollständigen Katalog<br>
        • Fordern Sie personalisierte Angebote an<br>
        • Kontaktieren Sie uns für Unterstützung
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">Wir sind für Sie da!<br>Das Di Dieffe B2B Team</p>
  </div>
</div>`
      },
      fr: {
        subject: 'Bienvenue chez Di Dieffe B2B!',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🎉 Bienvenue!</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Bonjour {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Merci d\'avoir vérifié votre compte! Vous pouvez maintenant accéder à notre catalogue et explorer nos produits.</p>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #1e40af;">
        <strong>💡 Ce que vous pouvez faire maintenant:</strong><br>
        • Parcourir notre catalogue complet<br>
        • Demander des devis personnalisés<br>
        • Nous contacter pour de l\'aide
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">Nous sommes là pour vous aider!<br>L\'équipe Di Dieffe B2B</p>
  </div>
</div>`
      },
      es: {
        subject: '¡Bienvenido a Di Dieffe B2B!',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🎉 ¡Bienvenido!</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hola {{nome}},</p>

    <p style="font-size: 14px; color: #666;">¡Gracias por verificar tu cuenta! Ahora puedes acceder a nuestro catálogo y empezar a explorar nuestros productos.</p>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #1e40af;">
        <strong>💡 Qué puedes hacer ahora:</strong><br>
        • Navega por nuestro catálogo completo<br>
        • Solicita presupuestos personalizados<br>
        • Contáctanos para obtener ayuda
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">¡Estamos aquí para ayudarte!<br>El equipo de Di Dieffe B2B</p>
  </div>
</div>`
      },
      pt: {
        subject: 'Bem-vindo ao Di Dieffe B2B!',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🎉 Bem-vindo!</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Olá {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Obrigado por verificar sua conta! Agora você pode acessar nosso catálogo e começar a explorar nossos produtos.</p>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #1e40af;">
        <strong>💡 O que você pode fazer agora:</strong><br>
        • Navegar pelo nosso catálogo completo<br>
        • Solicitar orçamentos personalizados<br>
        • Entre em contato para assistência
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">Estamos aqui para ajudar!<br>A equipe Di Dieffe B2B</p>
  </div>
</div>`
      },
      hr: {
        subject: 'Dobrodošli u Di Dieffe B2B!',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🎉 Dobrodošli!</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Pozdrav {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Hvala što ste potvrdili svoj račun! Sada možete pristupiti našem katalogu i početi istraživati naše proizvode.</p>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #1e40af;">
        <strong>💡 Što sada možete učiniti:</strong><br>
        • Pregledajte naš kompletan katalog<br>
        • Zatražite personalizirane ponude<br>
        • Kontaktirajte nas za pomoć
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">Tu smo da vam pomognemo!<br>Tim Di Dieffe B2B</p>
  </div>
</div>`
      },
      sl: {
        subject: 'Dobrodošli v Di Dieffe B2B!',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🎉 Dobrodošli!</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Pozdravljeni {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Hvala za potrditev vašega računa! Zdaj lahko dostopate do našega kataloga in začnete raziskovati naše izdelke.</p>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #1e40af;">
        <strong>💡 Kaj lahko storite zdaj:</strong><br>
        • Brskajte po našem popolnem katalogu<br>
        • Zahtevajte personalizirane ponudbe<br>
        • Kontaktirajte nas za pomoč
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">Tu smo, da vam pomagamo!<br>Ekipa Di Dieffe B2B</p>
  </div>
</div>`
      },
      el: {
        subject: 'Καλώς ήρθατε στο Di Dieffe B2B!',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🎉 Καλώς ήρθατε!</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Γεια σου {{nome}},</p>

    <p style="font-size: 14px; color: #666;">Ευχαριστούμε που επαληθεύσατε τον λογαριασμό σας! Τώρα μπορείτε να αποκτήσετε πρόσβαση στον κατάλογό μας και να αρχίσετε να εξερευνάτε τα προϊόντα μας.</p>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #1e40af;">
        <strong>💡 Τι μπορείτε να κάνετε τώρα:</strong><br>
        • Περιηγηθείτε στον πλήρη κατάλογό μας<br>
        • Ζητήστε εξατομικευμένες προσφορές<br>
        • Επικοινωνήστε μαζί μας για βοήθεια
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">Είμαστε εδώ για να βοηθήσουμε!<br>Η ομάδα Di Dieffe B2B</p>
  </div>
</div>`
      }
    }
  }
];

async function initializeTemplates() {
  console.log('🚀 Inizializzazione template email autenticazione...\n');

  const templatesRef = db.collection('email_templates');

  for (const template of authTemplates) {
    try {
      // Check if template already exists
      const existing = await templatesRef.where('slug', '==', template.slug).get();

      if (!existing.empty) {
        console.log(`⚠️  Template "${template.name}" esiste già, skip...`);
        continue;
      }

      // Add timestamps
      const templateData = {
        ...template,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await templatesRef.add(templateData);
      console.log(`✅ Template "${template.name}" creato con ID: ${docRef.id}`);
    } catch (error) {
      console.error(`❌ Errore creando template "${template.name}":`, error.message);
    }
  }

  console.log('\n✨ Inizializzazione completata!');
  process.exit(0);
}

initializeTemplates().catch(error => {
  console.error('❌ Errore fatale:', error);
  process.exit(1);
});
