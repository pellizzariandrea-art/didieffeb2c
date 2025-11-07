# Sistema Email Templates

Sistema completo per la gestione di template email multilingua (6 lingue: IT, EN, DE, FR, ES, PT).

## Architettura

### 1. Firestore Collection: `email_templates`
Ogni template ha questa struttura:
```javascript
{
  id: "auto-generated",
  name: "Email Benvenuto B2C",
  slug: "b2c_welcome",
  description: "Email di benvenuto per nuovi clienti B2C",
  category: "authentication" | "orders" | "notifications" | "marketing",
  enabled: true,
  variables: [
    {
      name: "nome",
      label: "Nome",
      description: "Nome dell'utente",
      required: true,
      example: "Mario"
    }
  ],
  translations: {
    it: { subject: "...", body: "..." },
    en: { subject: "...", body: "..." },
    // ... altre lingue
  },
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: "user_id",
  lastModifiedBy: "user_id"
}
```

### 2. Pagine Admin

#### `/admin-panel/settings` - Tab "Email & Brevo"
- **Configurazione Brevo SMTP**:
  - Email mittente
  - Nome mittente
  - Email reply-to
  - Nome reply-to

#### `/admin-panel/email-templates` - Gestione Template
- **Funzionalità**:
  - Visualizzazione template con filtri per categoria
  - Creazione nuovo template
  - Modifica template esistente
  - Eliminazione template
  - Toggle abilita/disabilita
  - Indicatori traduzioni completate per ogni lingua

### 3. Service Layer (`lib/firebase/email-templates.ts`)
Funzioni disponibili:
- `getEmailTemplates()` - Carica tutti i template
- `getEmailTemplate(id)` - Carica singolo template
- `getEmailTemplateBySlug(slug)` - Trova template per slug
- `createEmailTemplate(data, userId)` - Crea nuovo template
- `updateEmailTemplate(id, updates, userId)` - Aggiorna template
- `deleteEmailTemplate(id)` - Elimina template
- `toggleEmailTemplateStatus(id, userId)` - Toggle enable/disable

### 4. Type System (`types/email-template.ts`)
- `EmailTemplate` - Tipo principale
- `TemplateCategory` - Categorie disponibili
- `EmailTemplateVariable` - Struttura variabili
- `COMMON_VARIABLES` - Preset variabili comuni
- `formatVariable(name)` - Helper per formattare variabili
- `replaceVariables(text, values)` - Helper per sostituire variabili

## Inizializzazione Template

### Template Preinstallati
1. **Email Benvenuto B2C** (`b2c_welcome`)
   - Categoria: authentication
   - Variabili: nome, email

2. **Email Conferma B2B** (`b2b_confirmation`)
   - Categoria: authentication
   - Variabili: ragioneSociale, email

### Come Aggiungere Template Iniziali
```bash
# Modifica scripts/init-email-templates.ts
# Aggiungi il tuo template all'array initialTemplates

# Esegui lo script
npm run init-templates
```

## Utilizzo nei Flussi Email

### Esempio: Invio Email di Benvenuto B2C
```typescript
import { getEmailTemplateBySlug } from '@/lib/firebase/email-templates';
import { replaceVariables } from '@/types/email-template';

async function sendWelcomeEmail(user: User, language: 'it' | 'en' | ...) {
  // 1. Carica il template
  const template = await getEmailTemplateBySlug('b2c_welcome');

  if (!template || !template.enabled) {
    console.error('Template non trovato o disabilitato');
    return;
  }

  // 2. Ottieni la traduzione nella lingua desiderata
  const translation = template.translations[language];

  // 3. Sostituisci le variabili
  const subject = replaceVariables(translation.subject, {
    nome: user.nome
  });

  const body = replaceVariables(translation.body, {
    nome: user.nome,
    email: user.email
  });

  // 4. Invia email (con Brevo o altro servizio)
  await sendEmail({
    to: user.email,
    subject,
    htmlContent: body
  });
}
```

## Variabili Disponibili

### Preset Comuni (COMMON_VARIABLES)
- **user**: nome, cognome, email
- **company**: ragioneSociale, piva
- **order**: numeroOrdine, dataOrdine, totale, linkOrdine
- **shipping**: trackingNumber, courier

### Formato Variabili
Le variabili vanno inserite nel formato: `{{nomeVariabile}}`

Esempio:
```html
<p>Ciao {{nome}},</p>
<p>Il tuo ordine {{numeroOrdine}} è stato confermato!</p>
```

## Security Rules

Aggiungi a `firestore.rules`:
```javascript
match /email_templates/{templateId} {
  allow read, write, delete: if isAdmin();
}
```

## Modal Creazione Template

Il modal di creazione permette di:
1. Specificare nome, slug, descrizione
2. Scegliere categoria
3. Selezionare variabili da preset comuni
4. Crea automaticamente traduzioni vuote per tutte le 6 lingue

## Modal Modifica Template

Il modal di modifica permette di:
1. Tab per ogni lingua con indicatori completamento
2. Editor oggetto e corpo email
3. Pannello variabili con "click to insert"
4. Anteprima in tempo reale
5. Supporto HTML di base

## Best Practices

1. **Slug**: Usa snake_case, solo minuscole/numeri/underscore
2. **Traduzioni**: Almeno italiano è obbligatorio
3. **Variabili**: Documenta sempre le variabili richieste
4. **Enable/Disable**: Disabilita template non pronti invece di eliminarli
5. **Versioning**: Se modifichi un template in produzione, considera di creare una nuova versione

## Prossimi Sviluppi

- [ ] Integrazione con Brevo per invio email
- [ ] Preview email con dati reali
- [ ] Test email direttamente dal pannello
- [ ] Storia modifiche template
- [ ] Traduzione automatica con Claude AI
- [ ] Template cloning
- [ ] Import/Export template
