# Note e TODO - Progetto E-Commerce

**Data ultimo aggiornamento**: 2025-10-18
**Sessione corrente**: Implementazione sistema log viewer

---

## 📋 Stato Corrente del Progetto

### ✅ Completato nella sessione corrente

1. **Animazione di caricamento AI migliorata** (`frontend/components/AIDescription.tsx`)
   - Sostituita animazione porta assemblaggio con tema scienziato/Einstein
   - Aggiunto supporto multilingua (IT, EN, DE, FR, ES, PT)
   - Testo: "Stiamo preparando la documentazione per te"

2. **Placeholder immagini prodotto** (`frontend/public/placeholder.svg`)
   - Creato SVG professionale per prodotti senza immagine
   - Aggiornati tutti i riferimenti da `.png` a `.svg` in:
     - `ProductNavigationBar.tsx`
     - `ProductCard.tsx`
     - `CompareClient.tsx`

3. **Sistema di logging su file** (`frontend/lib/logger.ts`)
   - Log giornalieri: `logs/app-YYYY-MM-DD.log`
   - Rotazione automatica: elimina log > 30 giorni
   - 4 livelli: info, warn, error, debug
   - Formato JSON (una entry per riga)
   - Solo server-side (no browser impact)
   - Documentazione: `lib/README-LOGGER.md`

4. **Browser logger wrapper** (`frontend/components/AIDescription.tsx`)
   - Log solo in development mode
   - Nessun log in produzione (console pulita)

5. **Gestione silenziosa errori API** (`frontend/components/AIDescription.tsx`)
   - Errori 500, 429, 402 gestiti senza mostrare all'utente
   - Graceful degradation quando API crediti esauriti
   - Componente semplicemente non mostra sezione AI

6. **API endpoint per log** (`frontend/app/api/logs/route.ts`)
   - Endpoint: `/api/logs`
   - Autenticazione: Bearer Token
   - Parametri: date, level, component, search
   - Restituisce: logs array, files array, components array

7. **Pagina admin log viewer** (`admin/pages/logs.php`)
   - Link nel menu: "📋 Log"
   - **Modalità ibrida**:
     - **Locale**: Legge direttamente da filesystem
     - **Produzione**: Chiama API Next.js
   - Filtri: data, livello, componente, ricerca
   - Paginazione: 50 entries per pagina
   - Statistiche: file count, entries, size, components
   - Modal configurazione per API URL e token

8. **Configurazione token** (`.env.local` e `logs.php`)
   - Token generato: `6196f0e0b7c363e22a542111f19ecee718c6b1dff6eb88a8ff9e2e99097487d0`
   - Configurato in:
     - `frontend/.env.local`: `ADMIN_API_TOKEN=...`
     - `admin/pages/logs.php`: Default token

9. **Git ignore aggiornato**
   - Aggiunta directory `/logs` e `*.log` al `.gitignore`

---

## ❌ Problemi Aperti

### 🔴 PRIORITÀ ALTA: Log Viewer non funziona

**Problema**: La pagina `admin/pages/logs.php` mostra errore anche con lettura diretta filesystem

**Errore visualizzato**:
```
❌ Errore connessione API: Errore connessione: Failed to connect to 127.0.0.1 port 3007 after 0 ms: Could not connect to server
```

**Possibili cause**:
1. ✅ Directory `frontend/logs` esiste (creata)
2. ⚠️ Path filesystem potrebbe essere sbagliato
3. ⚠️ Permessi lettura file
4. ⚠️ Logica if/else non entra nel ramo filesystem
5. ⚠️ cURL disabilitato in PHP (problema Windows/XAMPP)

**Debug da fare**:
```php
// Aggiungere prima della riga 50 in admin/pages/logs.php:
$localLogsDir = dirname(dirname(dirname(__DIR__))) . '/frontend/logs';
echo "<!-- DEBUG: Local logs dir: $localLogsDir -->";
echo "<!-- DEBUG: Directory exists: " . (is_dir($localLogsDir) ? 'YES' : 'NO') . " -->";
if (is_dir($localLogsDir)) {
    $files = scandir($localLogsDir);
    echo "<!-- DEBUG: Files in directory: " . implode(', ', $files) . " -->";
}
```

**Possibile soluzione**:
1. Verificare path corretto con debug
2. Controllare che directory logs esista: `C:\Users\pelli\claude\ecommerce\frontend\logs`
3. Creare file log di test manualmente per vedere se viene letto
4. Verificare permessi lettura

**File coinvolti**:
- `admin/pages/logs.php` (linee 47-173)
- `frontend/logs/` (directory potrebbe essere vuota)

---

## 🏗️ Architettura Sistema Log

### Frontend (Next.js)
```
frontend/
├── lib/
│   ├── logger.ts              # Sistema logging con rotazione
│   └── README-LOGGER.md       # Documentazione logging
├── logs/                      # Directory log giornalieri
│   └── app-2025-10-18.log    # Formato: app-YYYY-MM-DD.log
├── app/
│   └── api/
│       └── logs/
│           └── route.ts       # API endpoint per esporre log
├── components/
│   └── AIDescription.tsx      # Usa browserLog wrapper
└── .env.local                 # ADMIN_API_TOKEN=...
```

### Admin (PHP)
```
admin/
├── includes/
│   └── header.php             # Menu con link "📋 Log"
├── pages/
│   └── logs.php               # Viewer con modalità ibrida
└── data/
    └── logs-config.json       # Config API URL e token (salvato dopo prima config)
```

---

## 🔧 Configurazione Corrente

### Server Next.js
- **Porta**: 3007 (3000 occupata)
- **URL locale**: http://localhost:3007
- **Variabile ambiente**: `ADMIN_API_TOKEN=6196f0e0b7c363e22a542111f19ecee718c6b1dff6eb88a8ff9e2e99097487d0`

### Admin PHP
- **URL locale**: http://localhost/admin/pages/logs.php
- **API URL default**: http://127.0.0.1:3007/api/logs
- **Token default**: `6196f0e0b7c363e22a542111f19ecee718c6b1dff6eb88a8ff9e2e99097487d0`
- **Path logs locale**: `../../../frontend/logs` (relativo da admin/pages/)

---

## 📝 TODO per prossima sessione

### 🔴 Priorità Alta

1. **Risolvere log viewer admin**
   - [ ] Aggiungere debug output per capire perché non legge filesystem
   - [ ] Verificare path corretto directory logs
   - [ ] Testare con file log di esempio
   - [ ] Se filesystem funziona, rimuovere fallback API per locale
   - [ ] Testare filtri e paginazione

2. **Generare log di test**
   - [ ] Navigare frontend per generare log reali
   - [ ] Verificare che file vengono creati in `frontend/logs/`
   - [ ] Controllare formato JSON dei log

### 🟡 Priorità Media

3. **Documentazione deployment**
   - [ ] Creare guida per configurare token in produzione
   - [ ] Documentare come configurare URL API in produzione
   - [ ] Testare modalità API (non filesystem) simulando produzione

4. **Testing completo**
   - [ ] Test filtro per livello (error, warn, info, debug)
   - [ ] Test filtro per componente
   - [ ] Test ricerca testo
   - [ ] Test paginazione con molti log
   - [ ] Test con file log di date diverse

### 🟢 Miglioramenti futuri

5. **UI/UX miglioramenti**
   - [ ] Aggiungere export CSV dei log filtrati
   - [ ] Aggiungere download singolo file log
   - [ ] Migliorare visualizzazione dati JSON (modal invece di alert)
   - [ ] Aggiungere auto-refresh ogni X secondi
   - [ ] Aggiungere grafici statistiche (errori nel tempo)

6. **Sicurezza**
   - [ ] Validare che token sia abbastanza forte in produzione
   - [ ] Aggiungere rate limiting all'API
   - [ ] Considerare IP whitelist per API log

---

## 🔍 Comandi Utili

### Verificare log creati
```bash
ls -la C:/Users/pelli/claude/ecommerce/frontend/logs/
```

### Creare log di test manualmente
```bash
cd C:/Users/pelli/claude/ecommerce/frontend/logs
echo '{"timestamp":"2025-10-18T10:00:00.000Z","level":"info","component":"TestComponent","message":"Test log entry","data":{"test":true}}' > app-2025-10-18.log
```

### Testare API da command line
```bash
curl -H "Authorization: Bearer 6196f0e0b7c363e22a542111f19ecee718c6b1dff6eb88a8ff9e2e99097487d0" http://localhost:3007/api/logs
```

### Verificare server Next.js
```bash
# Controllare quale porta usa
netstat -ano | findstr :3007
```

### Killare vecchi server Next.js
```bash
# Trovare PID processo sulla porta 3000
netstat -ano | findstr :3000
# Killare processo (sostituire PID)
taskkill /PID <PID> /F
```

---

## 📚 File Modificati Questa Sessione

### Nuovi file creati
1. `frontend/public/placeholder.svg` - Placeholder immagini prodotto
2. `frontend/lib/logger.ts` - Sistema logging
3. `frontend/lib/README-LOGGER.md` - Documentazione logging
4. `frontend/app/api/logs/route.ts` - API endpoint log
5. `admin/pages/logs.php` - Log viewer
6. `frontend/.env.local` - Variabili ambiente
7. `frontend/.env.example` - Esempio configurazione

### File modificati
1. `frontend/components/AIDescription.tsx` - Animazione, logging, error handling
2. `frontend/components/ProductNavigationBar.tsx` - Placeholder path
3. `frontend/components/ProductCard.tsx` - Placeholder path
4. `frontend/app/compare/CompareClient.tsx` - Placeholder path
5. `frontend/.gitignore` - Aggiunto /logs e *.log
6. `admin/includes/header.php` - Aggiunto link "📋 Log"

---

## 🎯 Obiettivi Completati

- [x] Migliorare animazione caricamento AI
- [x] Creare placeholder professionale
- [x] Implementare sistema logging file
- [x] Gestire silenziosamente errori API
- [x] Creare API endpoint log
- [x] Creare pagina admin log viewer
- [x] Configurare token autenticazione
- [x] Implementare modalità ibrida (filesystem + API)

---

## 💡 Note Importanti

### Sistema Logging
- I log vengono scritti **solo server-side** (API routes, Server Components)
- **Browser logs** usano wrapper browserLog (solo development)
- Formato: JSON, una entry per riga
- Rotazione: automatica all'avvio applicazione
- Retention: 30 giorni

### Modalità Log Viewer
- **Locale**: Legge direttamente filesystem (più veloce, no network)
- **Produzione**: Chiama API Next.js (necessario quando server diversi)
- Fallback automatico: se filesystem non disponibile → API

### Token Sicurezza
- Token attuale: `6196f0e0b7c363e22a542111f19ecee718c6b1dff6eb88a8ff9e2e99097487d0`
- **IMPORTANTE**: In produzione, generare nuovo token più forte
- Comando per generare: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Deploy Produzione
Quando vai in produzione:
1. Generare nuovo token sicuro
2. Impostare `ADMIN_API_TOKEN` nelle variabili d'ambiente server Next.js
3. Configurare admin tramite modal "⚙️ Configura"
4. Usare URL produzione (es: `https://tuodominio.com/api/logs`)

---

## 🐛 Bug Conosciuti

1. **Log viewer non funziona** (PRIORITÀ ALTA)
   - Errore connessione anche con filesystem
   - Path potrebbe essere sbagliato
   - Necessita debug

2. **Porta Next.js cambia** (MINORE)
   - Se porta 3000 occupata, usa 3007 o altra
   - Configurazione admin va aggiornata manualmente

---

## 🔗 Link Utili

- **Frontend locale**: http://localhost:3007
- **Admin locale**: http://localhost/admin/
- **Log viewer**: http://localhost/admin/pages/logs.php
- **API logs**: http://localhost:3007/api/logs

---

## 👤 Contesto Sviluppatore

- **OS**: Windows
- **Ambiente**: Local development (XAMPP/WAMP + Node.js)
- **Path progetto**: `C:\Users\pelli\claude\ecommerce\`
- **Next.js**: 15.5.5 con Turbopack
- **PHP**: Web server locale (probabilmente XAMPP/WAMP)

---

## 🎨 Modifiche UI Principali

### AIDescription Component
**Prima**: Animazione porta assemblaggio complessa
**Dopo**: Scienziato 🧑‍🔬 con pensiero 🤖💡✨

### Placeholder Immagini
**Prima**: placeholder.png mancante (errori 400)
**Dopo**: placeholder.svg professionale con gradiente

### Error Handling API
**Prima**: Errori rossi in console
**Dopo**: Gestione silenziosa, nessun errore visibile utente

---

**Fine documento - Buona fortuna per la prossima sessione! 🚀**
