# Admin Dashboard PHP - E-Commerce AI

Sistema di gestione per mappare database MySQL → JSON per e-commerce.

## 📋 Configurazione Database

Le credenziali sono già configurate in `config.php`:

- **Host**: localhost
- **Database**: dbepwcaa7nyeyf
- **Username**: ux6inage91l33
- **Password**: fbksamt3tdo9
- **Tabella**: V_B2B_EXPORT_CATALOGO_NEW

## 📁 Struttura Progetto

```
admin/
├── index.php                   # Dashboard home
├── config.php                  # Configurazione e credenziali DB
├── .htaccess                   # Protezione admin
├── pages/
│   ├── connection.php         # Step 1: Test connessione
│   ├── mapping.php            # Step 2: Mapping campi
│   ├── preview.php            # Step 3: Preview dati
│   └── export.php             # Step 4: Export JSON
├── includes/
│   ├── header.php             # Header con CSS
│   ├── footer.php             # Footer
│   └── functions.php          # Funzioni PHP
├── data/                      # Dati salvati (config, logs)
└── cron/
    └── auto-sync.php          # Script auto-sync

data/
├── products.json              # JSON generato (pubblico)
└── .htaccess                  # CORS headers
```

## 🚀 Installazione su SiteGround

### 1. Upload FTP

Carica tutte le cartelle su SiteGround:

```
/public_html/admin/           ← Carica tutta la cartella admin
/public_html/data/            ← Carica la cartella data
```

### 2. Permessi

Assicurati che queste cartelle abbiano i permessi corretti:

```bash
chmod 755 /public_html/admin/
chmod 755 /public_html/admin/data/
chmod 755 /public_html/data/
chmod 644 /public_html/admin/*.php
```

### 3. Accesso Admin

Una volta caricato, accedi al pannello admin:

```
https://tuodominio.it/admin/
```

## 🔐 Protezione Admin (Raccomandato)

### Opzione 1: Password HTTP

Via cPanel → "Directory Privacy" → Proteggi la cartella `/admin/`:

```
Username: admin
Password: la-tua-password-sicura
```

### Opzione 2: Protezione IP

Modifica `admin/.htaccess` e decommenta:

```apache
<RequireAny>
    Require ip TUO_IP_CASA
    Require ip TUO_IP_UFFICIO
</RequireAny>
```

## 📖 Come Usare

### Step 1: Test Connessione Database

1. Vai su `admin/pages/connection.php`
2. Le credenziali sono già precompilate
3. Clicca "Test Connessione"
4. Seleziona la tabella `V_B2B_EXPORT_CATALOGO_NEW`
5. Clicca "Salva e Continua"

### Step 2: Mapping Campi

1. Vai su `admin/pages/mapping.php`
2. Mappa i campi obbligatori:
   - Codice prodotto
   - Descrizione
   - Prezzo
   - Immagine (opzionale)
3. Aggiungi attributi dinamici (materiale, colore, serie, ecc.)
4. Clicca "Salva Mapping"

### Step 3: Preview

1. Vai su `admin/pages/preview.php`
2. Verifica l'anteprima dei primi 5 prodotti
3. Controlla che i dati siano corretti

### Step 4: Export JSON

1. Vai su `admin/pages/export.php`
2. Clicca "Genera products.json"
3. Copia l'URL pubblico del JSON
4. Usa questo URL nel tuo e-commerce Next.js

## 🌐 URL Pubblico JSON

Dopo l'export, il JSON sarà disponibile a:

```
https://tuodominio.it/data/products.json
```

Questo URL può essere usato nel tuo e-commerce su Vercel.

## 🔄 Auto-Sync (Opzionale)

Per automatizzare l'export ogni 6 ore:

1. Vai su cPanel → Cron Jobs
2. Aggiungi nuovo cron:

```bash
*/360 * * * * php /home/tuousername/public_html/admin/cron/auto-sync.php
```

## 💻 Utilizzo nel E-Commerce Next.js

Nel tuo progetto Next.js su Vercel:

```typescript
// lib/db/products.ts
const PRODUCTS_URL = 'https://tuodominio.it/data/products.json';

export async function getAllProducts() {
  const response = await fetch(PRODUCTS_URL, {
    next: { revalidate: 300 } // Cache 5 minuti
  });
  const json = await response.json();
  return json.prodotti;
}
```

## 📊 Struttura JSON Generato

```json
{
  "prodotti": [
    {
      "codice": "PROD001",
      "descrizione": "Nome prodotto",
      "prezzo": 99.99,
      "immagine": "https://...",
      "attributi": {
        "materiale": "Acciaio",
        "colore": "Nero",
        "serie": "Premium"
      }
    }
  ],
  "generated_at": "2025-01-15T10:30:00+00:00",
  "total": 150,
  "source": {
    "database": "dbepwcaa7nyeyf",
    "table": "V_B2B_EXPORT_CATALOGO_NEW"
  }
}
```

## 🐛 Troubleshooting

### Errore: "Can't connect to MySQL"

- Verifica che le credenziali in `config.php` siano corrette
- Su SiteGround usa sempre `localhost` come host
- Controlla che l'utente abbia permessi sul database

### Errore: "Permission denied"

```bash
chmod 755 /public_html/admin/data/
chmod 755 /public_html/data/
```

### JSON non accessibile

- Verifica che il file `.htaccess` sia presente in `/data/`
- Controlla i permessi: `chmod 644 products.json`
- Prova ad accedere direttamente: `tuodominio.it/data/products.json`

### Errori PHP

- Verifica versione PHP (minimo 7.4)
- Controlla error log in cPanel
- Attiva `display_errors` in `.htaccess` per debug

## ✅ Checklist Installazione

- [ ] Upload cartelle admin e data via FTP
- [ ] Verifica permessi cartelle (755)
- [ ] Accedi a `tuodominio.it/admin/`
- [ ] Test connessione database
- [ ] Configura mapping campi
- [ ] Preview dati trasformati
- [ ] Genera primo JSON
- [ ] Verifica JSON pubblico accessibile
- [ ] Setup protezione admin (password o IP)
- [ ] Configura cron job auto-sync (opzionale)

## 🎯 Prossimi Passi

1. Completa il setup dell'admin dashboard
2. Genera il file `products.json`
3. Verifica che sia accessibile pubblicamente
4. Usa l'URL nel tuo e-commerce Next.js su Vercel
5. Configura AI Claude per generare contenuti marketing

## 📞 Supporto

Per problemi o domande:

1. Controlla i log in `admin/data/activity.log`
2. Verifica error_log in cPanel
3. Testa la connessione database manualmente

---

**Nota**: Questo sistema è progettato per funzionare su SiteGround con PHP 7.4+. Non richiede dipendenze esterne o librerie aggiuntive.
