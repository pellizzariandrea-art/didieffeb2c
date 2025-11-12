// types/settings.ts
// Shared types for application settings

// Supported languages for email translations
export type SupportedLanguage = 'it' | 'en' | 'fr' | 'de' | 'es' | 'pt' | 'hr' | 'sl' | 'el';

export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; name: string; flag: string }[] = [
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'hr', name: 'Hrvatski', flag: '🇭🇷' },
  { code: 'sl', name: 'Slovenščina', flag: '🇸🇮' },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
];

// Email content with subject and body
export interface EmailContent {
  subject: string;
  body: string; // HTML template with variables like {{name}}, {{company}}, etc.
}

// Multilingual email template
export interface MultilingualEmailTemplate {
  enabled: boolean;
  translations: Record<SupportedLanguage, EmailContent>;
}

export interface CompanyInfo {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  vatNumber?: string;
  taxCode?: string;
}

export interface LogoConfig {
  base64: string;
  type: string; // MIME type (e.g., 'image/png')
  uploadedAt: string;
}

export interface BrevoConfig {
  apiKey?: string; // Not stored in Firestore, only on backend
  senderEmail: string;
  senderName: string;
  replyToEmail: string;
  replyToName: string;
}

// Email signature (multilingua)
export interface EmailSignature {
  translations: Record<SupportedLanguage, string>;
}

export interface EmailTemplates {
  b2c_welcome: MultilingualEmailTemplate;
  b2b_confirmation: MultilingualEmailTemplate;
}

export interface AppSettings {
  company: CompanyInfo;
  logo?: LogoConfig;
  brevo: BrevoConfig;
  emailSignature: EmailSignature;
  templates: EmailTemplates;
  updatedAt?: string;
  updatedBy?: string;
}

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  company: {
    name: 'Didieffe B2B',
    address: '',
    city: '',
    postalCode: '',
    province: '',
    country: 'Italia',
    phone: '',
    email: 'info@didieffe.com',
    website: 'https://shop.didieffeb2b.com',
  },
  brevo: {
    senderEmail: 'noreply@didieffe.com',
    senderName: 'Didieffe B2B',
    replyToEmail: 'info@didieffe.com',
    replyToName: 'Didieffe Support',
  },
  emailSignature: {
    translations: {
      it: 'Cordiali saluti,<br>Il Team Didieffe',
      en: 'Best regards,<br>The Didieffe Team',
      fr: 'Cordialement,<br>L\'équipe Didieffe',
      de: 'Mit freundlichen Grüßen,<br>Das Didieffe Team',
      es: 'Saludos cordiales,<br>El equipo Didieffe',
      pt: 'Atenciosamente,<br>A equipe Didieffe',
    },
  },
  templates: {
    b2c_welcome: {
      enabled: true,
      translations: {
        it: {
          subject: 'Benvenuto su Didieffe B2B!',
          body: `<p>Gentile <strong>{{name}}</strong>,</p>
<p>Benvenuto su <strong>{{company}}</strong>!</p>
<p>Grazie per esserti registrato sulla nostra piattaforma B2C. Il tuo account è stato creato con successo.</p>
<p>Puoi ora accedere al catalogo prodotti e iniziare a fare acquisti.</p>
<p>Se hai domande, non esitare a contattarci.</p>
<p>Cordiali saluti,<br>Il team Didieffe</p>`,
        },
        en: {
          subject: 'Welcome to Didieffe B2B!',
          body: `<p>Dear <strong>{{name}}</strong>,</p>
<p>Welcome to <strong>{{company}}</strong>!</p>
<p>Thank you for registering on our B2C platform. Your account has been created successfully.</p>
<p>You can now access the product catalog and start shopping.</p>
<p>If you have any questions, please don't hesitate to contact us.</p>
<p>Best regards,<br>The Didieffe Team</p>`,
        },
        fr: {
          subject: 'Bienvenue sur Didieffe B2B!',
          body: `<p>Cher <strong>{{name}}</strong>,</p>
<p>Bienvenue sur <strong>{{company}}</strong>!</p>
<p>Merci de vous être inscrit sur notre plateforme B2C. Votre compte a été créé avec succès.</p>
<p>Vous pouvez maintenant accéder au catalogue de produits et commencer vos achats.</p>
<p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
<p>Cordialement,<br>L'équipe Didieffe</p>`,
        },
        de: {
          subject: 'Willkommen bei Didieffe B2B!',
          body: `<p>Sehr geehrte/r <strong>{{name}}</strong>,</p>
<p>Willkommen bei <strong>{{company}}</strong>!</p>
<p>Vielen Dank für Ihre Registrierung auf unserer B2C-Plattform. Ihr Konto wurde erfolgreich erstellt.</p>
<p>Sie können nun auf den Produktkatalog zugreifen und mit dem Einkaufen beginnen.</p>
<p>Bei Fragen zögern Sie bitte nicht, uns zu kontaktieren.</p>
<p>Mit freundlichen Grüßen,<br>Das Didieffe Team</p>`,
        },
        es: {
          subject: '¡Bienvenido a Didieffe B2B!',
          body: `<p>Estimado/a <strong>{{name}}</strong>,</p>
<p>¡Bienvenido/a a <strong>{{company}}</strong>!</p>
<p>Gracias por registrarse en nuestra plataforma B2C. Su cuenta ha sido creada exitosamente.</p>
<p>Ahora puede acceder al catálogo de productos y comenzar a comprar.</p>
<p>Si tiene alguna pregunta, no dude en contactarnos.</p>
<p>Saludos cordiales,<br>El equipo Didieffe</p>`,
        },
        pt: {
          subject: 'Bem-vindo à Didieffe B2B!',
          body: `<p>Caro/a <strong>{{name}}</strong>,</p>
<p>Bem-vindo/a à <strong>{{company}}</strong>!</p>
<p>Obrigado por se registrar na nossa plataforma B2C. Sua conta foi criada com sucesso.</p>
<p>Agora você pode acessar o catálogo de produtos e começar a comprar.</p>
<p>Se tiver alguma dúvida, não hesite em nos contatar.</p>
<p>Atenciosamente,<br>A equipe Didieffe</p>`,
        },
      },
    },
    b2b_confirmation: {
      enabled: true,
      translations: {
        it: {
          subject: 'Richiesta Registrazione B2B Ricevuta - Didieffe',
          body: `<p>Gentile <strong>{{name}}</strong>,</p>
<p>Grazie per aver richiesto un account B2B presso <strong>{{company}}</strong>.</p>
<p>La tua richiesta è stata ricevuta e verrà esaminata dal nostro team il prima possibile.</p>
<p><strong>Informazioni ricevute:</strong></p>
<ul>
  <li>Nome: {{name}}</li>
  <li>Email: {{email}}</li>
  <li>Azienda: {{userCompany}}</li>
</ul>
<p>Ti contatteremo entro 24-48 ore per confermare l'attivazione del tuo account B2B.</p>
<p>Cordiali saluti,<br>Il team Didieffe</p>`,
        },
        en: {
          subject: 'B2B Registration Request Received - Didieffe',
          body: `<p>Dear <strong>{{name}}</strong>,</p>
<p>Thank you for requesting a B2B account with <strong>{{company}}</strong>.</p>
<p>Your request has been received and will be reviewed by our team as soon as possible.</p>
<p><strong>Information received:</strong></p>
<ul>
  <li>Name: {{name}}</li>
  <li>Email: {{email}}</li>
  <li>Company: {{userCompany}}</li>
</ul>
<p>We will contact you within 24-48 hours to confirm the activation of your B2B account.</p>
<p>Best regards,<br>The Didieffe Team</p>`,
        },
        fr: {
          subject: 'Demande d\'inscription B2B reçue - Didieffe',
          body: `<p>Cher <strong>{{name}}</strong>,</p>
<p>Merci d'avoir demandé un compte B2B auprès de <strong>{{company}}</strong>.</p>
<p>Votre demande a été reçue et sera examinée par notre équipe dans les plus brefs délais.</p>
<p><strong>Informations reçues:</strong></p>
<ul>
  <li>Nom: {{name}}</li>
  <li>Email: {{email}}</li>
  <li>Société: {{userCompany}}</li>
</ul>
<p>Nous vous contacterons dans les 24-48 heures pour confirmer l'activation de votre compte B2B.</p>
<p>Cordialement,<br>L'équipe Didieffe</p>`,
        },
        de: {
          subject: 'B2B-Registrierungsanfrage erhalten - Didieffe',
          body: `<p>Sehr geehrte/r <strong>{{name}}</strong>,</p>
<p>Vielen Dank für Ihre Anfrage für ein B2B-Konto bei <strong>{{company}}</strong>.</p>
<p>Ihre Anfrage wurde erhalten und wird schnellstmöglich von unserem Team geprüft.</p>
<p><strong>Erhaltene Informationen:</strong></p>
<ul>
  <li>Name: {{name}}</li>
  <li>E-Mail: {{email}}</li>
  <li>Firma: {{userCompany}}</li>
</ul>
<p>Wir werden Sie innerhalb von 24-48 Stunden kontaktieren, um die Aktivierung Ihres B2B-Kontos zu bestätigen.</p>
<p>Mit freundlichen Grüßen,<br>Das Didieffe Team</p>`,
        },
        es: {
          subject: 'Solicitud de registro B2B recibida - Didieffe',
          body: `<p>Estimado/a <strong>{{name}}</strong>,</p>
<p>Gracias por solicitar una cuenta B2B con <strong>{{company}}</strong>.</p>
<p>Su solicitud ha sido recibida y será revisada por nuestro equipo lo antes posible.</p>
<p><strong>Información recibida:</strong></p>
<ul>
  <li>Nombre: {{name}}</li>
  <li>Email: {{email}}</li>
  <li>Empresa: {{userCompany}}</li>
</ul>
<p>Nos pondremos en contacto con usted en 24-48 horas para confirmar la activación de su cuenta B2B.</p>
<p>Saludos cordiales,<br>El equipo Didieffe</p>`,
        },
        pt: {
          subject: 'Solicitação de registro B2B recebida - Didieffe',
          body: `<p>Caro/a <strong>{{name}}</strong>,</p>
<p>Obrigado por solicitar uma conta B2B com <strong>{{company}}</strong>.</p>
<p>Sua solicitação foi recebida e será analisada por nossa equipe o mais breve possível.</p>
<p><strong>Informações recebidas:</strong></p>
<ul>
  <li>Nome: {{name}}</li>
  <li>Email: {{email}}</li>
  <li>Empresa: {{userCompany}}</li>
</ul>
<p>Entraremos em contato em 24-48 horas para confirmar a ativação de sua conta B2B.</p>
<p>Atenciosamente,<br>A equipe Didieffe</p>`,
        },
      },
    },
  },
};
