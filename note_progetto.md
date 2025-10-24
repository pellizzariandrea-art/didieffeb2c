# 📋 NOTE PROGETTO E-COMMERCE B2B - DIDIEFFEB2B

**Data ultimo aggiornamento**: 24 Ottobre 2025
**Sessione corrente**: Sistema Email Multilingue + Traduzioni AI + Debug Logo

---

## 🎯 OVERVIEW PROGETTO

### Descrizione
E-commerce B2B con sistema admin per mappare database MySQL → JSON, frontend Next.js con AI integrata per contenuti marketing, wizard di ricerca guidata, e carrello Snipcart.

### Architettura Sistema

```
DATABASE MYSQL (SiteGround)
         ↓
ADMIN BACKEND (PHP su SiteGround)
    ├─ Mapping DB → JSON
    ├─ Export products.json
    ├─ Wizard Builder
    ├─ Gallery Config
    └─ API endpoints
         ↓
products.json (pubblico - CORS enabled)
         ↓
FRONTEND (Next.js 15.5.5 su Vercel)
    ├─ Legge products.json
    ├─ AI descrizioni (Anthropic Claude)
    ├─ Wizard ricerca guidata
    ├─ Filtri dinamici multilingua
    ├─ Carrello Snipcart
    └─ Email Brevo
```

---

## 🛠️ STACK TECNOLOGICO

### Frontend (Vercel)
- **Framework**: Next.js 15.5.5 (App Router + Turbopack)
- **Linguaggio**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui + Lucide icons
- **AI**: Anthropic Claude API (@anthropic-ai/sdk)
- **Image optimization**: Next.js Image + Vercel
- **State Management**: React Contexts (Language, Compare, Wishlist)
- **Cart**: Snipcart
- **Email**: Brevo API
- **Multilingua**: 6 lingue (IT, EN, DE, FR, ES, PT)

### Backend (SiteGround)
- **Linguaggio**: PHP 7.4+
- **Database**: MySQL
  - Host: localhost
  - Database: dbepwcaa7nyeyf
  - Tabella: V_B2B_EXPORT_CATALOGO_NEW
- **Configurazione**: JSON files
- **Deploy**: FTP manuale o script PowerShell

### URL Produzione
- **Frontend**: https://didieffeb2c.vercel.app
- **Backend Admin**: https://shop.didieffeb2b.com/admin/
- **Products JSON**: https://shop.didieffeb2b.com/data/products.json
- **Repository**: https://github.com/pellizzariandrea-art/didieffeb2c

---

## 📁 STRUTTURA PROGETTO

```
ecommerce/
├── frontend/                       # Next.js App (Deploy: Vercel)
│   ├── app/
│   │   ├── page.tsx               # Homepage
│   │   ├── products/
│   │   │   ├── page.tsx           # Catalog con filtri
│   │   │   └── [code]/
│   │   │       └── page.tsx       # Product detail
│   │   ├── api/
│   │   │   ├── csrf-token/        # CSRF token endpoint
│   │   │   ├── logs/              # Admin logs API
│   │   │   ├── cache/
│   │   │   │   └── refresh/       # Cache refresh (auth + rate limit)
│   │   │   ├── get-variant-config/ # Gallery config proxy
│   │   │   └── debug-galleries/   # Debug endpoint
│   │   └── admin/
│   │       └── api/
│   │           └── get-wizard-config/ # Wizard config proxy
│   ├── components/
│   │   ├── ProductGrid.tsx        # Grid prodotti con paginazione
│   │   ├── ProductDetail.tsx      # Dettaglio prodotto + gallery dinamiche
│   │   ├── ProductCarousel.tsx    # Carousel prodotti (non usato attualmente)
│   │   ├── WizardSearch.tsx       # Wizard ricerca guidata (mobile-optimized)
│   │   ├── FilterSidebar.tsx      # Filtri dinamici multilingua
│   │   ├── VariantSelector.tsx    # Selezione varianti prodotto
│   │   ├── AIDescription.tsx      # AI content + loading animation
│   │   └── ImageGallery.tsx       # Lightbox immagini
│   ├── lib/
│   │   ├── csrf.ts                # CSRF protection (Double Submit Cookie)
│   │   ├── rate-limit.ts          # Rate limiting con presets
│   │   ├── logger.ts              # Sistema logging su file
│   │   ├── db/products.ts         # Data access layer (cache + fetch)
│   │   ├── server/products-cache.ts # Server-side cache management
│   │   └── product-utils.ts       # Utility funzioni (traduzioni, etc)
│   ├── logs/                      # Log files giornalieri (git ignored)
│   ├── .env.local                 # Environment variables (git ignored)
│   └── next.config.ts             # Config with security headers
│
├── admin/                          # PHP Backend (Deploy: SiteGround FTP)
│   ├── index.php                  # Dashboard home
│   ├── config.php                 # DB credentials
│   ├── pages/
│   │   ├── wizard-builder.php     # Builder configurazione wizard
│   │   ├── mapping.php            # Mapping DB → JSON
│   │   ├── export.php             # Export JSON
│   │   └── logs.php               # Log viewer (filesystem + API)
│   ├── api/
│   │   ├── get-wizard-config.php  # Config wizard
│   │   ├── get-gallery-config.php # Config gallery (CRITICO)
│   │   ├── generate-ai-description.php # AI descriptions
│   │   └── (altri endpoint debug)
│   ├── data/
│   │   ├── wizard-config.json     # Configurazione wizard
│   │   ├── mapping-config.json    # Configurazione mapping
│   │   ├── variant-config.json    # Configurazione varianti
│   │   └── (altri config files)
│   └── includes/
│       ├── header.php             # Header con menu
│       ├── footer.php             # Footer
│       └── functions.php          # Funzioni comuni
│
├── data/
│   └── products.json              # JSON pubblico generato (CORS enabled)
│
├── note_progetto.md               # QUESTA NOTA (unica fonte verità)
├── DEPLOY.md                      # Guida deploy
├── SESSION_NOTES.md               # Note sessione wizard (22 Ott 2025)
└── deploy-to-siteground.ps1       # Script deploy FTP automatico
```

---

## 🔄 STATO CORRENTE (24 Ottobre 2025)

### ✅ Completato Oggi (24 Ottobre 2025)

#### 1. Sistema Email Multilingue con Brevo + Traduzioni AI
**Obiettivo**: Implementare sistema email transazionali multilingua (6 lingue) per B2C welcome e B2B confirmation

**Implementazione**:
- ✅ Creato struttura types per email multilingue (`types/settings.ts`)
- ✅ Integrato con backend PHP per traduzioni AI (usa Claude API)
- ✅ Endpoint traduzione: `/admin/api/translate-content.php`
  - Legge API key da `admin/data/translation-settings.json`
  - Preserva HTML tags e variabili template `{{name}}`, `{{company}}`, etc.
- ✅ Frontend API route: `/api/translate-email/route.ts`
  - Chiama backend PHP per ogni lingua target
  - Gestisce fallback in caso di errore
- ✅ Pagina impostazioni admin con editor email per tutte le lingue
  - Tab separata "Email & Brevo"
  - Configurazione Brevo (sender, reply-to)
  - Editor per ogni lingua (IT, EN, FR, DE, ES, PT)
  - Pulsante "Traduci da Italiano" automatico
  - Test email con selezione template + lingua
- ✅ Firebase Firestore per storage settings
  - `lib/firebase/settings.ts` - CRUD operations
  - `lib/firebase/config.ts` - Firebase initialization
  - Cache 5 minuti per performance
- ✅ Migrazione automatica da vecchia struttura
  - Detecta vecchia struttura senza `translations`
  - Migra preservando dati esistenti
  - Salva struttura aggiornata in Firestore

**Funzioni Email**:
- `sendWelcomeEmailB2C(email, name, language)` - Email benvenuto B2C
- `sendB2BRegistrationConfirmation(email, company, language)` - Conferma registrazione B2B
- Template variables: `{{name}}`, `{{email}}`, `{{company}}`, `{{userCompany}}`, etc.

**File Creati/Modificati**:
```
✅ frontend/types/settings.ts (NEW)
✅ frontend/lib/firebase/config.ts (NEW)
✅ frontend/lib/firebase/settings.ts (NEW)
✅ frontend/lib/brevo.ts (NEW)
✅ frontend/app/admin-panel/settings/page.tsx (NEW)
✅ frontend/app/api/send-test-email/route.ts (NEW)
✅ frontend/app/api/translate-email/route.ts (NEW)
✅ admin/api/translate-content.php (NEW)
✅ admin/data/translation-settings.json (EXISTING - riutilizzato)
```

**Fix Errori Build/Runtime**:
- ✅ Fix JSX syntax error in settings page (line 826)
  - Da: `{{'{'}}{'{'}name{'}'}{'}'}`
  - A: `` {`{{name}}`} ``
  - **Commit**: `5573829`
- ✅ Fix runtime error "Cannot read properties of undefined (reading 'it')"
  - Causa: Firestore aveva vecchia struttura email
  - Soluzione: Migrazione automatica in `getAppSettings()`
  - **Commit**: `63128b0`

**Commit Principali**:
- `5573829` - "Fix JSX syntax error in settings page"
- `63128b0` - "Add automatic migration from old to new multilingual email structure"

#### 2. Debug Logo in Email (⚠️ IN CORSO)
**Problema**: Logo caricato in Firestore ma NON visualizzato nelle email ricevute

**Stato Attuale**:
- ✅ Logo è già salvato in Firestore (verificato da screenshot settings page)
- ✅ Codice upload logo è corretto (usa `FileReader.readAsDataURL()`)
- ✅ Fallback default logo presente nel codice
- ⚠️ Logo non appare nelle email (solo alt text "Didieffe B2B" visibile)

**Debug Aggiunto**:
- Aggiunto logging dettagliato in `send-test-email/route.ts`:
  ```typescript
  [Test Email] Logo debug: {
    hasLogoObject: boolean,
    hasBase64: boolean,
    base64Prefix: string (primi 30 char),
    logoType: string
  }
  ```
- **Commit**: `3889167` - "Add debug logging for logo in test email endpoint"

**Possibili Cause Identificate**:
1. **Gmail/Email client blocca immagini base64 grandi** (limite ~50-100KB)
2. **Base64 troncato o incompleto** nel database
3. **Formato data URI non corretto** (manca prefisso `data:image/...;base64,`)
4. **Client email blocca inline images** per sicurezza

**Prossimi Passi da Fare**:
- [ ] Inviare email di test e controllare log console server
- [ ] Verificare sorgente HTML email (Gmail → "Mostra originale")
- [ ] Controllare dimensione logo base64 (potrebbe essere troppo grande)
- [ ] **Soluzione alternativa**: Usare URL pubblico invece di base64
  - Caricare logo su Vercel public folder o cloud storage
  - Usare URL assoluto `https://...` nell'email
  - Email client caricano URL senza problemi

**File Modificato**:
```
✅ frontend/app/api/send-test-email/route.ts (debug logging)
```

### ✅ Completato Precedentemente (23 Ottobre 2025)

#### 1. Fix Gallery Images Vercel Production
**Problema**: Gallery "Altri Serie", "Altri hanno visto anche" non mostravano immagini su Vercel mobile
**Causa**: File API `get-gallery-config.php` e route Next.js `get-variant-config` non erano in git
**Soluzione**:
- Committato `app/api/get-variant-config/route.ts` (proxy API)
- Committato `admin/api/get-gallery-config.php` (backend critico)
- Committato `components/ProductCarousel.tsx` (per futuro uso)
- Fix immagini ProductGrid con `loading="lazy"` e `placeholder="blur"`
- **Commit**: `dafc377` + `394a936`

#### 2. Fix Variant Images Mobile
**Problema**: Immagini varianti mostravano placeholder su Vercel mobile
**Causa**: Fallback mancante da `variant.immagini[0]` a `variant.immagine` (singolare)
**Soluzione**: Aggiunto fallback completo in `VariantSelector.tsx:306`
```typescript
src={variant.immagini?.[0] || variant.immagine || '/placeholder.png'}
```
- **Commit**: `6cf017b`

#### 3. Security Hardening (OPZIONALE - COMPLETATO)
**CSRF Protection**:
- Creato `lib/csrf.ts` con Double Submit Cookie pattern
- Endpoint `/api/csrf-token` per ottenere token
- Applicato a `POST /api/cache/refresh`
- Documentazione completa in `lib/CSRF_README.md`

**Rate Limiting**:
- Creato `lib/rate-limit.ts` con Sliding Window algorithm
- Presets: strict (5/min), standard (30/min), relaxed (100/min), admin (10/min)
- Applicato a:
  - `POST /api/cache/refresh` (admin preset)
  - `GET /api/logs` (admin preset)
- In-memory storage (scalabile a Redis/Upstash)
- Documentazione completa in `lib/RATE_LIMIT_README.md`

**Security Headers** (next.config.ts):
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options, X-Content-Type-Options
- Referrer-Policy, Permissions-Policy

**Commit**: `330ae98` - "Implement CSRF Protection and Rate Limiting"

#### 4. Verifiche File Mancanti
- Controllo sistematico di tutti file non tracciati
- Verificato che tutti import/fetch nel codice puntano a file esistenti
- Confermato che nessun file critico manca

### 🔧 Funzionalità Principali Attive

1. **Sistema Email Transazionali Multilingue** ✨ NUOVO
   - 6 lingue supportate (IT, EN, FR, DE, ES, PT)
   - Traduzioni automatiche via AI (Claude API tramite backend PHP)
   - Template email:
     - B2C Welcome (email benvenuto clienti)
     - B2B Confirmation (conferma registrazione aziende)
   - Variabili template dinamiche (`{{name}}`, `{{company}}`, etc.)
   - Editor admin per personalizzare ogni lingua
   - Invio via Brevo API tramite PHP proxy (IP statico SiteGround)
   - Storage settings su Firebase Firestore
   - Test email con preview

2. **Wizard Ricerca Guidata**
   - Mobile-optimized (testo più piccolo, touch-friendly)
   - Integrato in search bar mobile, floating button desktop
   - Supporta caratteristiche (filtri booleani) + filtri standard
   - Traduzioni valori filtri corrette (usa approccio FilterSidebar)

3. **Gallery Dinamiche Prodotto**
   - "Altri Serie: X" - Prodotti stessa serie
   - "Altri Tipologia: Y" - Prodotti stessa tipologia
   - Configurazione da `get-gallery-config.php` → `variant-config.json`
   - Max 2 attributi per gallery

4. **Filtri Multilingua**
   - 6 lingue supportate (IT, EN, DE, FR, ES, PT)
   - Traduzioni automatiche valori attributi
   - URL parametrization con `NEXT_PUBLIC_API_URL`

5. **AI Descriptions** (Anthropic Claude)
   - Generazione automatica descrizioni prodotto
   - Cache per ridurre costi
   - Animazione caricamento tematica (scienziato)
   - Error handling silenzioso

6. **Security Features**
   - CSRF protection su endpoint sensibili
   - Rate limiting su admin API
   - Security headers CSP/HSTS
   - Token authentication per admin API

---

## 🔜 PROSSIMI PASSI: FIREBASE AUTHENTICATION

### Piano Implementazione

#### FASE 1: Protezione Backend Admin (PRIORITÀ ALTA)
**Obiettivo**: Proteggere API backend PHP con Firebase Authentication

**Setup**:
1. Firebase Authentication - Email/password per admin
2. 1-2 account admin iniziali
3. Protezione API PHP con verifica token Firebase
4. Login page admin nel frontend (`/admin/login`)

**Middleware PHP** per tutte le API admin:
- `/admin/api/get-wizard-config.php`
- `/admin/api/get-gallery-config.php`
- `/admin/api/generate-ai-description.php`
- etc.

**Flusso**:
```
1. Admin apre /admin/login su frontend Next.js
2. Login email/password → Firebase Auth
3. Firebase ritorna JWT token
4. Ogni chiamata API PHP include token nell'header
5. PHP verifica token con Firebase → se valido, esegue API
6. Se token invalido/mancante → 401 Unauthorized
```

**Costi**: GRATUITO con 10-100 ordini/giorno (free tier Firebase)

#### FASE 2: Sistema Ordini Clienti (FUTURA)
- Firebase Firestore per ordini
- Auth clienti (opzionale, o guest checkout)
- Carrello → Checkout → Salvataggio ordine
- Dashboard ordini per admin

### Decisioni da Prendere
- [ ] Tipo auth admin: solo email/password o anche Google OAuth?
- [ ] Hai già account Google/Firebase?
- [ ] Tutte le API admin vanno protette?

---

## 📊 TECNOLOGIE E CONFIGURAZIONI IMPORTANTI

### Environment Variables (.env.local)

```bash
# Backend API
NEXT_PUBLIC_API_URL=https://shop.didieffeb2b.com
NEXT_PUBLIC_BACKEND_URL=https://shop.didieffeb2b.com

# Admin Security
ADMIN_API_TOKEN=6196f0e0b7c363e22a542111f19ecee718c6b1dff6eb88a8ff9e2e99097487d0

# Anthropic AI (per descrizioni prodotto)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# Firebase (per email settings + auth futura)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCEJqGfZ0m3pOQtBMOsb-xxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=didieffeb2b-ecommerce.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=didieffeb2b-ecommerce
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=didieffeb2b-ecommerce.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxxxx

# Brevo Email API (usato via PHP proxy)
BREVO_API_KEY=xkeysib-xxxxx

# Snipcart (futuro)
NEXT_PUBLIC_SNIPCART_PUBLIC_KEY=your_key
```

### Database MySQL (SiteGround)
```
Host: localhost
Database: dbepwcaa7nyeyf
Username: ux6inage91l33
Password: fbksamt3tdo9
Tabella: V_B2B_EXPORT_CATALOGO_NEW
```

### Rate Limit Presets

```typescript
RateLimitPresets.strict    // 5 req/min - Login, pagamenti
RateLimitPresets.standard  // 30 req/min - API normali
RateLimitPresets.relaxed   // 100 req/min - Endpoint pubblici
RateLimitPresets.admin     // 10 req/min - Admin endpoints
```

### Lingue Supportate
IT (default), EN, DE, FR, ES, PT

### Wizard Configuration
- Step 1: Welcome
- Step 2: Characteristics (filtri booleani - Applicazione su...)
- Step 3-N: Filtri attributi (Tipologia, Materiale, Colore...)
- Step Final: Results preview

---

## 🚀 DEPLOYMENT

### Frontend → Vercel (Automatico)
```bash
git add .
git commit -m "Descrizione modifiche"
git push
# Vercel deploya automaticamente
```

### Backend → SiteGround (Script)
```powershell
# Prima volta: configura password FTP
[System.Environment]::SetEnvironmentVariable('SITEGROUND_FTP_PASSWORD', 'tua-password', 'User')

# Deploy
cd C:\Users\pelli\claude\ecommerce
.\deploy-to-siteground.ps1
```

**Deploy Script Features**:
- Upload automatico cartella `admin/`
- Ignora file temporanei e log
- Progress in tempo reale
- Conferma prima di procedere

---

## 🐛 TROUBLESHOOTING

### Gallery non mostrano immagini
✅ **RISOLTO**: Committato `get-gallery-config.php` e `get-variant-config` route

### Immagini placeholder su Vercel
✅ **RISOLTO**: Aggiunto fallback `variant.immagine` e ottimizzato Next.js Image

### CORS Error wizard config
✅ **RISOLTO**: Creato API route proxy `/admin/api/get-wizard-config`

### Filtri booleani non riconosciuti
✅ **RISOLTO**: Accettare valori `['0', '1']` non solo `['1']`

### Traduzioni filtri non funzionanti
✅ **RISOLTO**: Usare `getTranslatedValue()` come FilterSidebar

### JSX syntax error in settings page (Vercel build failed)
✅ **RISOLTO**: Semplificato template literals per variabili email - Commit `5573829`

### Runtime error "Cannot read properties of undefined (reading 'it')"
✅ **RISOLTO**: Aggiunta migrazione automatica da vecchia a nuova struttura email - Commit `63128b0`

### Logo non visualizzato nelle email (⚠️ IN CORSO)
⚠️ **IN ANALISI**:
- Logo salvato in Firestore ma non appare in email ricevuta
- Debug logging aggiunto in `send-test-email/route.ts`
- Possibile causa: Gmail blocca immagini base64 grandi (>50-100KB)
- **Soluzione proposta**: Usare URL pubblico invece di base64
- **Prossimo step**: Controllare log debug + sorgente HTML email

---

## 💡 NOTE TECNICHE IMPORTANTI

### Attributi Multilingua
Gli attributi hanno questa struttura:
```typescript
{
  value: { it: 'Borchie', en: 'Studs', de: 'Nieten', ... },
  label: { it: 'Borchie', en: 'Studs', de: 'Nieten', ... }
}
```

Usare sempre `getTranslatedValue(val, lang)` per ottenere traduzione corretta.

### Filtri Booleani
I filtri "Applicazione su X" hanno:
- `availableValues: ['0', '1']` (non solo `['1']`)
- Valore selezionato è sempre `'1'` (true)
- Devono essere riconosciuti come booleani in wizard

### Cache Management
- **Products cache**: Gestito in `lib/server/products-cache.ts`
- **AI cache**: File JSON con expiry 30 giorni
- **Refresh endpoint**: `/api/cache/refresh` (protetto con CSRF + Rate Limit)

### Image Optimization
- Next.js Image component richiede props specifiche su Vercel:
  - `loading="lazy"` o `"eager"`
  - `placeholder="blur"` con `blurDataURL`
  - `sizes` attribute per responsive optimization
- Fallback chain sempre: `primary || secondary || placeholder`

### Security Best Practices
1. ✅ CSRF token per POST endpoints sensibili
2. ✅ Rate limiting per admin endpoints
3. ✅ Security headers (CSP, HSTS, etc.)
4. ✅ Token authentication per admin API
5. ✅ Environment variables mai committate
6. 🔜 Firebase Authentication per admin/clienti

---

## 📝 COMANDI UTILI

### Development
```bash
cd frontend
npm run dev              # Start dev server (porta 3000 o 3007)
npm run build            # Build produzione
npm run lint             # Lint check
npx tsc --noEmit         # Type check
```

### Git Operations
```bash
git status               # Vedi modifiche
git add .                # Staging all changes
git commit -m "msg"      # Commit
git push                 # Deploy frontend automaticamente
git log --oneline -5     # Ultimi 5 commit
```

### Debug
```bash
# Check logs giornalieri
ls -la frontend/logs/

# Test API con curl
curl -H "Authorization: Bearer TOKEN" http://localhost:3007/api/logs

# Kill dev server
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Verifica immagini
curl -I https://didieffeb2c.vercel.app/_next/image?url=...
```

---

## 📚 DOCUMENTAZIONE AGGIUNTIVA

### File Documentazione nel Progetto
- `lib/CSRF_README.md` - Guida completa CSRF protection
- `lib/RATE_LIMIT_README.md` - Guida completa rate limiting
- `lib/README-LOGGER.md` - Sistema logging
- `DEPLOY.md` - Guida deploy completa
- `SESSION_NOTES.md` - Note sessione wizard (22 Ott)
- `final-claude-code-brief.md` - Brief iniziale progetto

### Link Esterni Utili
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Firebase Console](https://console.firebase.google.com)
- [Anthropic Claude API](https://docs.anthropic.com)
- [Snipcart Docs](https://docs.snipcart.com)

---

## 📞 CONTESTO SVILUPPO

- **OS**: Windows 11
- **Path progetto**: `C:\Users\pelli\claude\ecommerce\`
- **Editor**: VS Code (presumibilmente)
- **PHP Server**: XAMPP/WAMP locale per testing admin
- **Node.js**: v18+ (per Next.js 15)
- **Dev Ports**:
  - Frontend: 3000 (o 3007 se occupato)
  - PHP Admin locale: http://localhost/admin/

---

## 🎯 CHECKLIST SESSIONE FUTURA

Quando riprendi il progetto, verifica:

- [ ] Vercel deployment funzionante (https://didieffeb2c.vercel.app)
- [ ] Gallery images visibili su mobile
- [ ] Backend admin accessibile (https://shop.didieffeb2b.com/admin/)
- [ ] Products JSON accessibile (https://shop.didieffeb2b.com/data/products.json)
- [ ] Se implementi Firebase: segui FASE 1 del piano sopra
- [ ] Aggiorna questa nota con nuove modifiche

---

## 🚨 FILE CRITICI - NON MODIFICARE SENZA BACKUP

- `admin/api/get-gallery-config.php` - Gallery configuration (CRITICO)
- `admin/api/get-wizard-config.php` - Wizard configuration
- `admin/api/translate-content.php` - Traduzioni AI email (NUOVO)
- `admin/data/wizard-config.json` - Configurazione wizard
- `admin/data/mapping-config.json` - Mapping DB → JSON
- `admin/data/translation-settings.json` - API key Claude per traduzioni
- `frontend/lib/db/products.ts` - Data access layer
- `frontend/lib/server/products-cache.ts` - Cache management
- `frontend/lib/firebase/settings.ts` - Settings CRUD Firestore (NUOVO)
- `frontend/lib/firebase/config.ts` - Firebase initialization (NUOVO)
- `frontend/lib/brevo.ts` - Email functions (NUOVO)
- `frontend/next.config.ts` - Security headers + config
- `.env.local` - Environment variables (GIT IGNORED)

---

## 🎉 SUCCESSI E MILESTONE

- ✅ **22 Ott 2025**: Wizard mobile-optimized + fix traduzioni filtri
- ✅ **23 Ott 2025**: Fix gallery images Vercel + Security hardening completo
- ✅ **23 Ott 2025**: Verifica file mancanti + consolidamento documentazione
- ✅ **24 Ott 2025**: Sistema email multilingue completo (6 lingue) + traduzioni AI + Firebase Firestore
- ⚠️ **24 Ott 2025**: Debug logo in email (IN CORSO)
- 🔜 **Prossimo**: Risolvere visualizzazione logo + Firebase Authentication per admin (FASE 1)

---

**🤖 Documento generato e consolidato da Claude Code**
**Ultima modifica**: 24 Ottobre 2025, 11:40
**Per nuove sessioni**: Leggi prima questa nota, poi procedi con modifiche

---

## 🔑 PROMEMORIA CHIAVE

1. **Deploy separati**: Frontend Git→Vercel (auto), Backend FTP→SiteGround (manuale)
2. **File critici**: `get-gallery-config.php`, `get-wizard-config.php`, `translate-content.php`, config JSON
3. **Security**: CSRF + Rate Limiting attivi su admin endpoints
4. **Multilingua**: Sempre usare `getTranslatedValue()` per traduzioni prodotti
5. **Email multilingua**: 6 lingue, traduzioni AI automatiche, settings su Firebase Firestore
6. **Image optimization**: Fallback chain + loading/placeholder props per Vercel
7. **Logo in email**: ⚠️ PROBLEMA IN CORSO - base64 potrebbe essere troppo grande per Gmail
8. **Firebase attivo**: Firestore per email settings, Auth per admin backend (da implementare)
9. **Costi Firebase**: GRATIS con 10-100 ordini/giorno (free tier)
10. **Questa nota**: Unica fonte di verità - aggiorna sempre dopo modifiche importanti

---

**Fine documento - Buona continuazione! 🚀**
