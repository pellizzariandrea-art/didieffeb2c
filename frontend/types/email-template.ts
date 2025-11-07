// types/email-template.ts
// Email Template Types for Dynamic Template Management

export type SupportedLanguage = 'it' | 'en' | 'de' | 'fr' | 'es' | 'pt';

export type TemplateCategory =
  | 'authentication'  // Login, registrazione, reset password
  | 'orders'          // Conferma ordine, spedizione, consegna
  | 'notifications'   // Notifiche generiche
  | 'marketing';      // Newsletter, promozioni

export type TargetAudience = 'b2b' | 'b2c';

export interface EmailTemplateVariable {
  name: string;        // es: "nome", "numeroOrdine"
  label: string;       // es: "Nome cliente", "Numero ordine"
  description: string; // es: "Il nome del cliente registrato"
  required: boolean;
  example: string;     // es: "Mario Rossi", "#12345"
}

export interface EmailTemplateTranslation {
  subject: string;
  body: string;
}

export interface EmailTemplate {
  id: string;

  // Metadata
  name: string;                    // es: "Registrazione B2C", "Conferma Ordine"
  slug: string;                    // es: "b2c_welcome", "order_confirmation"
  description: string;             // Descrizione del template
  category: TemplateCategory;
  targetAudience: TargetAudience[]; // B2B, B2C o entrambi

  // Variables
  variables: EmailTemplateVariable[];  // Variabili disponibili nel template

  // Content
  translations: {
    [key in SupportedLanguage]: EmailTemplateTranslation;
  };

  // Status
  enabled: boolean;

  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;              // User ID
  lastModifiedBy?: string;         // User ID
}

export interface EmailTemplateCreate {
  name: string;
  slug: string;
  description: string;
  category: TemplateCategory;
  targetAudience: TargetAudience[];
  variables: EmailTemplateVariable[];
  enabled?: boolean;
}

export interface EmailTemplateUpdate {
  name?: string;
  description?: string;
  category?: TemplateCategory;
  targetAudience?: TargetAudience[];
  variables?: EmailTemplateVariable[];
  translations?: {
    [key in SupportedLanguage]?: EmailTemplateTranslation;
  };
  enabled?: boolean;
}

// Predefined variable presets for common use cases
export const COMMON_VARIABLES: { [key: string]: EmailTemplateVariable[] } = {
  user: [
    {
      name: 'nome',
      label: 'Nome',
      description: 'Nome dell\'utente',
      required: true,
      example: 'Mario'
    },
    {
      name: 'cognome',
      label: 'Cognome',
      description: 'Cognome dell\'utente',
      required: true,
      example: 'Rossi'
    },
    {
      name: 'email',
      label: 'Email',
      description: 'Indirizzo email dell\'utente',
      required: true,
      example: 'mario.rossi@example.com'
    }
  ],
  company: [
    {
      name: 'ragioneSociale',
      label: 'Ragione Sociale',
      description: 'Nome dell\'azienda (B2B)',
      required: true,
      example: 'Acme S.r.l.'
    },
    {
      name: 'piva',
      label: 'Partita IVA',
      description: 'Partita IVA dell\'azienda',
      required: false,
      example: 'IT12345678901'
    }
  ],
  order: [
    {
      name: 'numeroOrdine',
      label: 'Numero Ordine',
      description: 'Numero identificativo dell\'ordine',
      required: true,
      example: '#12345'
    },
    {
      name: 'dataOrdine',
      label: 'Data Ordine',
      description: 'Data in cui è stato effettuato l\'ordine',
      required: true,
      example: '07/11/2025'
    },
    {
      name: 'totale',
      label: 'Totale Ordine',
      description: 'Importo totale dell\'ordine',
      required: true,
      example: '€ 150,00'
    },
    {
      name: 'linkOrdine',
      label: 'Link Ordine',
      description: 'URL per visualizzare i dettagli dell\'ordine',
      required: false,
      example: 'https://shop.example.com/orders/12345'
    }
  ],
  shipping: [
    {
      name: 'trackingNumber',
      label: 'Numero Tracking',
      description: 'Codice di tracciamento spedizione',
      required: false,
      example: 'ABC123456789'
    },
    {
      name: 'courier',
      label: 'Corriere',
      description: 'Nome del corriere',
      required: false,
      example: 'DHL'
    }
  ],
  signature: [
    {
      name: 'firma',
      label: 'Firma Email',
      description: 'Firma configurata negli settings (multilingua)',
      required: false,
      example: 'Cordiali saluti,<br>Il Team Didieffe'
    }
  ]
};

// Template variable placeholder format: {{variableName}}
export const formatVariable = (name: string): string => `{{${name}}}`;

export const extractVariables = (text: string): string[] => {
  const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1]);
  }
  return [...new Set(matches)];
};

export const replaceVariables = (
  text: string,
  values: { [key: string]: string }
): string => {
  let result = text;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
};
