# 🚀 Guida Deployment su SiteGround (PHP)

## 📋 Cosa Caricare su SiteGround

SiteGround ospita solo la parte **PHP (Backend/Admin)**. Il frontend Next.js va su Vercel/altro.

---

## 📁 Cartelle da Caricare

### ✅ DA CARICARE (PHP Backend)

```
/admin/                          ← TUTTA LA CARTELLA
  ├── .htaccess                  ✅ Protezione admin
  ├── config.php                 ✅ Configurazione DB
  ├── index.php                  ✅ Dashboard admin
  ├── /pages/                    ✅ Tutte le pagine admin
  │   ├── settings.php           ✅ Impostazioni traduzioni
  │   ├── export-v2.php          ✅ Export prodotti
  │   ├── products.php           ✅ Gestione prodotti
  │   └── ...
  ├── /includes/                 ✅ Functions, header, footer
  ├── /api/                      ✅ API endpoint PHP
  │   ├── get-product.php
  │   ├── generate-ai-description.php
  │   └── ...
  ├── /data/                     ✅ File JSON configurazione
  │   ├── translation-settings.json
  │   ├── export-v2-state.json
  │   ├── report-config.json
  │   └── ...
  ├── /cron/                     ✅ Script automatici
  └── didieffeb2b-ecommerce-firebase-adminsdk-*.json  ✅ Firebase

/data/                           ✅ Dati pubblici
  └── products.json              ✅ Catalogo prodotti

/risorse/                        ✅ Immagini, loghi, file statici
/risorse_download/               ✅ File scaricabili
/scripts/                        ✅ Script PHP utility

config.php                       ✅ Config root (se presente)
index.php                        ✅ Homepage (se presente)
.htaccess                        ✅ Rewrite rules (se presente)
```

---

### ❌ NON CARICARE (Frontend Next.js)

```
/frontend/                       ❌ Va su Vercel/Netlify
  ├── app/
  ├── components/
  ├── public/
  ├── package.json
  ├── next.config.js
  └── ...

/node_modules/                   ❌ Mai caricare
.git/                            ❌ Mai caricare
.env                             ❌ Mai caricare (usa variabili SiteGround)
```

---

## 🔧 Configurazione SiteGround

### 1️⃣ Preparazione File

**PRIMA di caricare**, verifica:

#### File `admin/config.php` (linee 12-18):
```php
// Configurazione Database SiteGround
define('DB_HOST', 'localhost');           // ← Verifica con SiteGround
define('DB_PORT', '3306');
define('DB_NAME', 'dbepwcaa7nyeyf');      // ← Il tuo DB SiteGround
define('DB_USER', 'ux6inage91l33');       // ← Il tuo user SiteGround
define('DB_PASS', 'fbksamt3tdo9');        // ← La tua password SiteGround
define('DB_TABLE', 'V_B2B_EXPORT_CATALOGO_NEW');
```

⚠️ **IMPORTANTE:** Se carichi su repository pubblico (GitHub), NON committare le credenziali!

---

### 2️⃣ Caricamento FTP/SFTP

**Opzione A: FTP/SFTP Cliente (FileZilla, WinSCP)**

1. Connettiti a SiteGround:
   - Host: `ftp.tuosito.com` o IP fornito da SiteGround
   - User: il tuo username SiteGround
   - Password: la tua password SiteGround
   - Porta: 21 (FTP) o 22 (SFTP)

2. Naviga nella cartella web root:
   - Di solito: `/public_html/` o `/www/`

3. Carica le cartelle:
   ```
   public_html/
   ├── admin/           ← Carica TUTTA la cartella
   ├── data/            ← Carica questa
   ├── risorse/         ← Carica questa
   ├── risorse_download/
   ├── scripts/
   ├── config.php       ← Se presente
   └── index.php        ← Se presente
   ```

**Opzione B: File Manager SiteGround**

1. Login su SiteGround
2. Vai su **Site Tools → Site → File Manager**
3. Naviga in `public_html/`
4. Upload → Seleziona cartelle → Carica

---

### 3️⃣ Permessi File (CHMOD)

Dopo il caricamento, imposta i permessi corretti:

```bash
# Cartelle dati (devono essere scrivibili)
/admin/data/           → 755 o 775
/data/                 → 755 o 775

# File configurazione (solo lettura)
/admin/config.php      → 644
/admin/.htaccess       → 644

# File Firebase (privato)
/admin/didieffeb2b-*.json  → 600 (solo admin)

# Tutti gli altri file PHP
*.php                  → 644
```

**Come impostare CHMOD su SiteGround:**
1. File Manager → Click destro sul file/cartella
2. Change Permissions
3. Imposta il valore

---

### 4️⃣ Verifica URL

Dopo il caricamento, testa questi endpoint:

```
✅ Admin Dashboard:
https://shop.didieffeb2b.com/admin/

✅ Settings traduzioni:
https://shop.didieffeb2b.com/admin/pages/settings.php

✅ API prodotto:
https://shop.didieffeb2b.com/admin/api/get-product.php?codice=XXX

✅ Catalogo JSON pubblico:
https://shop.didieffeb2b.com/data/products.json
```

---

## 🔐 Sicurezza

### File `.htaccess` in `/admin/`

Verifica che esista e contenga:

```apache
# Proteggi admin
AuthType Basic
AuthName "Admin Area"
AuthUserFile /path/to/.htpasswd
Require valid-user

# Blocca accesso ai file JSON sensibili
<FilesMatch "\.(json)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>

# Permetti solo translation-settings.json se servito da API
<Files "translation-settings.json">
    Order Allow,Deny
    Allow from all
</Files>
```

---

## 🗂️ Struttura File su SiteGround

```
public_html/                      (root web SiteGround)
│
├── admin/                        ← Backend amministrativo
│   ├── .htaccess                 ← Protezione HTTP Basic Auth
│   ├── config.php                ← Config DB
│   ├── index.php                 ← Dashboard
│   ├── pages/
│   │   ├── settings.php          ← Impostazioni traduzioni
│   │   ├── export-v2.php         ← Export catalogo
│   │   ├── products.php          ← Gestione prodotti
│   │   └── ...
│   ├── includes/
│   │   ├── functions.php
│   │   ├── header.php
│   │   ├── footer.php
│   │   └── ...
│   ├── api/
│   │   ├── get-product.php
│   │   ├── generate-ai-description.php
│   │   └── ...
│   ├── data/
│   │   ├── translation-settings.json
│   │   ├── export-v2-state.json
│   │   ├── report-config.json
│   │   └── ...
│   └── didieffeb2b-firebase-*.json
│
├── data/
│   └── products.json             ← Catalogo pubblico (API)
│
├── risorse/
│   ├── logo_ddf.png
│   └── ...
│
├── risorse_download/
│   └── ...
│
└── scripts/
    └── ...
```

---

## 🔄 Workflow Deploy Completo

### 1. Sviluppo Locale
```bash
# Lavori in locale su:
C:\Users\pelli\claude\ecommerce\
```

### 2. Commit Git (Opzionale)
```bash
git add admin/
git commit -m "Update admin settings and translations"
git push
```

### 3. Deploy su SiteGround
```bash
# Via FTP/SFTP carica solo:
- /admin/
- /data/
- /risorse/
- /scripts/
```

### 4. Frontend Next.js
```bash
# Separatamente, deploy frontend su Vercel:
cd frontend/
vercel --prod
```

---

## 🐛 Troubleshooting

### Errore: "500 Internal Server Error"
✅ Verifica permessi file (CHMOD 644 per .php)
✅ Controlla `.htaccess` per sintassi errata
✅ Abilita error reporting in config.php:
```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

### Errore: "Database connection failed"
✅ Verifica credenziali in `config.php`
✅ Verifica che il DB sia accessibile da SiteGround
✅ Controlla firewall/whitelist IP

### Errore: "Permission denied writing to data/"
✅ CHMOD 755 o 775 su `/admin/data/`
✅ Verifica ownership file (deve essere www-data o apache)

### Admin non accessibile
✅ Verifica `.htaccess` in `/admin/`
✅ Crea `.htpasswd` se richiesto
✅ Controlla URL: `https://shop.didieffeb2b.com/admin/` (con trailing slash)

---

## 📝 Checklist Deploy

Prima di andare in produzione:

- [ ] Backup database SiteGround
- [ ] Verifica credenziali DB in `config.php`
- [ ] Carica `/admin/` completa
- [ ] Carica `/data/`, `/risorse/`, `/scripts/`
- [ ] Imposta CHMOD corretti
- [ ] Verifica `.htaccess` funzionante
- [ ] Testa login admin
- [ ] Testa API endpoint
- [ ] Verifica `translation-settings.json` accessibile
- [ ] Testa generazione AI descrizioni
- [ ] Testa export catalogo
- [ ] Verifica catalogo JSON pubblico accessibile
- [ ] Frontend Vercel punta agli endpoint corretti

---

## 🔗 Connessione Frontend → Backend

Il frontend Next.js (Vercel) chiama il backend PHP (SiteGround) via API:

```typescript
// frontend/lib/config.ts
export const API_URL = 'https://shop.didieffeb2b.com';

// Chiamate API
fetch(`${API_URL}/admin/api/get-product.php?codice=XXX`)
fetch(`${API_URL}/data/products.json`)
fetch(`${API_URL}/admin/data/translation-settings.json`)
```

⚠️ **CORS**: Assicurati che SiteGround permetta richieste da Vercel!

Aggiungi in `/admin/api/*.php`:
```php
header("Access-Control-Allow-Origin: https://tuofrontend.vercel.app");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
```

---

## 📞 Supporto

**SiteGround:** https://www.siteground.com/support
**Documentazione PHP:** https://www.php.net/docs.php
**Guide deployment:** Vedi `note_progetto.md`

---

**Ultima modifica:** 10 Novembre 2025
**Target:** SiteGround PHP 8.x
**Database:** MySQL 8.0
