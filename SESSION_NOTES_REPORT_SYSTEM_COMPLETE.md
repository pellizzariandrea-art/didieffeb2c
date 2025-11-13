# 🎯 Sistema Report Dinamici - Completato

**Data sessione:** 8 Novembre 2025
**Stato:** Sistema report funzionante con wizard + JSON editor

---

## ✅ COMPLETATO

### 1. Architettura Sistema Report

**Backend (PHP su SiteGround):**
- `admin/api/execute-query.php` - Esegue query MySQL con parametri sicuri (prepared statements)
- `admin/data/query-config.json` - Configurazione query SQL con parametri tipizzati
- Autenticazione tramite credenziali in `admin/config.php`
- Sistema di parametri con validazione tipo (string, int, date, float)

**Frontend (Next.js 15.5.5):**
- **API Routes Next.js** (proxy per evitare CORS):
  - `/api/reports/config` - CRUD per report-config.json (GET, POST, DELETE)
  - `/api/queries/config` - CRUD per query-config.json (GET, POST, DELETE)
  - `/api/test-query` - Proxy + Mock Mode per testare query

**File di configurazione:**
- `admin/data/query-config.json` - Definizioni query SQL
- `admin/data/report-config.json` - Configurazioni display report

---

### 2. Report Wizard (5 Steps) ✅

**Location:** `frontend/app/admin-panel/reports/ReportWizard.tsx`

#### Step 1: Query SQL
- Input Query Slug (ID univoco)
- Input Descrizione
- Textarea per SQL query
- **Bottone "Test Query & Rileva Campi":**
  - Salva temporaneamente la query in `query-config.json`
  - Chiama backend (o mock mode se non disponibile)
  - Auto-rileva colonne dal risultato
  - Crea automaticamente configurazione colonne base

**Mock Mode Intelligente:**
- Attivo quando backend non disponibile (404, errori)
- Legge SQL dal campo textarea
- Estrae nomi colonne con regex dal SELECT
- Genera dati di esempio basati su naming convention

#### Step 2: Colonne ✅
**Tabella configurazione colonne:**
- **Colonna Vis.** - Checkbox per mostrare/nascondere
- **Colonna 🔒** - **Radio button per marcare campo codice cliente** ⭐ NUOVO
- Campo DB (nome tecnico)
- Etichetta (modificabile)
- Tipo dato

**Gestione Codice Cliente:**
- Seleziona quale campo della query contiene il codice cliente
- Campo evidenziato in arancione quando selezionato
- Info box mostra il campo scelto
- Salvato come `clientCodeField` nel report config

**Bottone "Traduci con Claude AI":**
- Chiama `/api/translate-email-template`
- Traduce tutte le etichette colonne in 6 lingue (IT, EN, DE, FR, ES, PT)
- Trasforma label da string a oggetto multilingua

#### Step 3: Raggruppamenti
- Placeholder - può essere saltato
- Messaggio: "Salta questo step per ora"

#### Step 4: Filtri
- Placeholder - può essere saltato
- Messaggio: "Salta questo step per ora"

#### Step 5: Riepilogo ✅
**Campi configurazione:**
- Report Slug (ID univoco, non modificabile in edit)
- Titolo Report
- Descrizione
- **Info box campo codice cliente** (se selezionato in Step 2)
- Checkbox tipologie cliente (B2B, B2C)
- Checkbox "Report abilitato"

**Box riepilogo:**
- Query utilizzata
- Numero colonne definite
- Raggruppamenti (count)
- Filtri (count)

---

### 3. JSON Editor ✅

**Location:** `frontend/app/admin-panel/reports/SimpleJsonEditor.tsx`

**Problema risolto:** Monaco Editor aveva conflitti SSR con Next.js

**Soluzione:** Editor JSON semplice ma completo con textarea

**Features:**
- **Split view** (Query Config | Report Config)
- **Validazione JSON real-time** con indicatori visuali (✅/❌)
- **Bottoni:**
  - Copia - Copia JSON negli appunti
  - Formatta - Formatta JSON con indentazione
  - Ripristina - Annulla modifiche
  - Salva - Salva entrambe le configurazioni
  - Chiudi - Ritorna alla lista
- **Warning modifiche non salvate**
- **Footer:** Suggerimento workflow con Claude Code

**Workflow Claude Code Integration:**
1. Apri JSON Editor (bottone viola Code)
2. Copia il JSON
3. Chiedi a Claude Code di modificarlo
4. Incolla il JSON modificato
5. Salva

---

### 4. Report Manager UI ✅

**Location:** `frontend/app/admin-panel/reports/page.tsx`

**Lista Report con:**
- Badge stato (Disabilitato se `enabled: false`)
- Badge tipologie cliente (🏢 B2B / 👤 B2C / Tutti)
- Info: Query slug, numero raggruppamenti
- **Bottoni azioni:**
  - 👁️ Abilita/Disabilita (Eye/EyeOff)
  - 💜 Modifica JSON (Code icon) → Apre SimpleJsonEditor
  - 🔵 Modifica via Wizard (Edit2 icon) → Apre ReportWizard in edit mode
  - 🗑️ Elimina (Trash2 icon)

**Funzionalità:**
- Creazione nuovo report → Wizard
- Modifica report esistente → Wizard (carica dati da report-config + query-config)
- Eliminazione con conferma
- Toggle enabled/disabled

---

### 5. Area Clienti - Report ✅

**Location:**
- `frontend/app/my-account/reports/page.tsx` - Lista report
- `frontend/app/my-account/reports/[slug]/page.tsx` - Visualizzazione report

**Filtro Role-Based:**
```typescript
const availableReports = allReports.filter((report) => {
  if (report.enabled === false) return false;
  if (!report.clientTypes || report.clientTypes.length === 0) {
    return true; // Disponibile a tutti
  }
  return report.clientTypes.includes(user!.role as 'b2b' | 'b2c');
});
```

**Authorization Check:**
- Verifica che l'utente abbia accesso al report
- Verifica che il report sia abilitato
- Passa `clientCode` dell'utente al ReportBuilder

---

### 6. Gestione Codice Cliente (COMPLETATO OGGI) ⭐

**Problema originale:**
Come filtrare automaticamente i dati per l'utente loggato?

**Soluzione implementata:**

1. **Step 2 del Wizard:**
   - Colonna 🔒 con radio button
   - Admin seleziona quale campo della query contiene il codice cliente
   - Es: `CKY_CNT_CLFR` per la query ordini

2. **Salvataggio:**
   ```json
   {
     "clientCodeField": "CKY_CNT_CLFR",
     // ... resto config
   }
   ```

3. **Esecuzione report (TODO - vedi sotto):**
   - ReportBuilder legge `clientCodeField`
   - Quando chiama la query, passa automaticamente:
     ```javascript
     params: {
       [clientCodeField]: user.clientCode
     }
     ```

**Esempio pratico:**
```sql
SELECT ... FROM V_B2B_STORIA_ORDINI_RIGHE
WHERE CKY_CNT_CLFR = :clientCode
```

Admin seleziona radio su `CKY_CNT_CLFR` → Sistema filtra automaticamente per utente

---

## 🔄 FLUSSO COMPLETO

### Creazione Report (Admin):
1. Click "Nuovo Report" → Apre Wizard
2. **Step 1:** Scrive query SQL → Test → Auto-rileva colonne
3. **Step 2:** Personalizza etichette → **Seleziona campo codice cliente con radio 🔒**
4. **Step 3-4:** Salta (opzionali)
5. **Step 5:** Imposta titolo, descrizione, tipi cliente
6. Salva → Crea `query-config.json` + `report-config.json`

### Modifica Report (Admin):
**Opzione A - Via Wizard:**
- Click bottone 🔵 (Edit2) → Carica dati esistenti → Modifica → Salva

**Opzione B - Via JSON Editor:**
- Click bottone 💜 (Code) → Editor split-view
- Modifica JSON manualmente o con Claude Code
- Salva

### Visualizzazione Report (Utente B2B/B2C):
1. Accede a `/my-account/reports`
2. Vede solo report abilitati per il suo ruolo
3. Click su report → Apre ReportBuilder
4. **Dati filtrati automaticamente per suo codice cliente** (se `clientCodeField` configurato)

---

## 📁 STRUTTURA FILE

```
frontend/
├── app/
│   ├── admin-panel/
│   │   └── reports/
│   │       ├── page.tsx                      # Lista report manager
│   │       ├── ReportWizard.tsx              # Wizard 5 step ✅
│   │       ├── SimpleJsonEditor.tsx          # Editor JSON ✅
│   │       └── ReportJsonEditorWrapper.tsx   # (deprecato - usava Monaco)
│   │
│   ├── my-account/
│   │   └── reports/
│   │       ├── page.tsx                      # Lista report utente ✅
│   │       └── [slug]/
│   │           └── page.tsx                  # Visualizza report ✅
│   │
│   └── api/
│       ├── reports/
│       │   └── config/
│       │       └── route.ts                  # CRUD report-config.json ✅
│       ├── queries/
│       │   └── config/
│       │       └── route.ts                  # CRUD query-config.json ✅
│       └── test-query/
│           └── route.ts                      # Test query + Mock mode ✅
│
├── components/
│   └── reports/
│       ├── ReportBuilder.tsx                 # Componente visualizzazione report
│       ├── ReportTable.tsx                   # Tabella dati
│       ├── ReportFilters.tsx                 # Filtri utente
│       └── ReportExport.tsx                  # Export PDF/Excel/CSV
│
├── types/
│   └── report.ts                             # TypeScript types ✅
│
└── lib/
    └── report-engine.ts                      # Engine esecuzione query

admin/
├── api/
│   └── execute-query.php                     # Backend MySQL executor ✅
├── data/
│   ├── query-config.json                     # Configurazioni query SQL ✅
│   └── report-config.json                    # Configurazioni report ✅
└── config.php                                # DB credentials + helpers
```

---

## ❌ COSA MANCA

### 1. Implementare filtro automatico per codice cliente ⚠️ PRIORITÀ ALTA

**Dove:** `frontend/components/reports/ReportBuilder.tsx` o `frontend/lib/report-engine.ts`

**Cosa fare:**
```typescript
// In ReportBuilder.tsx quando chiama la query:

const executeQuery = async () => {
  const params = {
    ...userProvidedParams,
    // Aggiunge automaticamente filtro codice cliente
    ...(config.clientCodeField && user?.clientCode ? {
      [config.clientCodeField]: user.clientCode
    } : {})
  };

  const response = await fetch('/api/execute-report', {
    method: 'POST',
    body: JSON.stringify({
      querySlug: config.query,
      params
    })
  });
};
```

**Oppure modifica SQL dinamicamente:**
```typescript
// Aggiunge WHERE clause se clientCodeField è definito
if (config.clientCodeField && user?.clientCode) {
  sql += ` WHERE ${config.clientCodeField} = '${user.clientCode}'`;
}
```

---

### 2. Step 3 (Raggruppamenti) - Opzionale

**Se necessario, implementare:**
- UI per definire livelli gerarchici di raggruppamento
- Campo da raggruppare
- Label gruppo
- Opzione "Mostra subtotali"
- Opzione "Collapsed by default"

**Struttura dati:**
```json
"grouping": [
  {
    "field": "anno",
    "label": "Anno",
    "level": 1,
    "showTotals": true,
    "collapsed": false
  }
]
```

---

### 3. Step 4 (Filtri) - Opzionale

**Se necessario, implementare:**
- Filtri utente dinamici (dropdown, date range, text search)
- Opzioni da query o statiche
- Valori default

**Struttura dati:**
```json
"filters": [
  {
    "field": "tipo_documento",
    "label": "Tipo Documento",
    "type": "select",
    "options": "auto",
    "default": null
  }
]
```

---

### 4. Sistema Traduzioni Centralizzato

**Implementato parzialmente:**
- Bottone "Traduci con Claude AI" in Step 2 funziona
- Usa `/api/translate-email-template` esistente

**Cosa manca:**
- Tradurre anche:
  - Titolo report
  - Descrizione report
  - Label filtri (quando implementati)
  - Label raggruppamenti (quando implementati)

**Soluzione proposta:**
- Step 6 del wizard: "Traduzioni"
- Oppure bottone unico alla fine dello Step 5
- Raccoglie tutti i testi da tradurre
- Una sola chiamata API
- Aggiorna tutte le label in formato multilingua

---

### 5. Deploy Backend su SiteGround

**File da caricare:**
1. `admin/api/execute-query.php` - ✅ FATTO (hai detto di averlo caricato)
2. `admin/data/query-config.json` - ❓ DA VERIFICARE
   - Deve contenere la query "ee" (storia ordini)
   - Deve essere sincronizzato con quello locale

**Test backend reale:**
- Attualmente usa sempre Mock Mode
- Dopo deploy, dovrebbe chiamare backend vero
- Verificare che credenziali DB in `admin/config.php` siano corrette

---

### 6. Miglioramenti Editor Colonne (Step 2)

**Features opzionali:**
- Riordino colonne (drag & drop)
- Cambio tipo dato (string/number/date/currency)
- Formato custom (es: "€ #,##0.00" per currency)
- Larghezza colonna (pixel)
- Allineamento (left/center/right)

**Attualmente:**
- Solo visibilità (checkbox)
- Solo etichetta (input text)
- Solo campo codice cliente (radio)

---

### 7. Autenticazione API Routes

**Attualmente:** Nessuna auth sugli endpoint `/api/reports/config` e `/api/queries/config`

**Da implementare:**
```typescript
// In ogni route.ts
const token = request.headers.get('Authorization');
if (token !== `Bearer ${process.env.ADMIN_API_TOKEN}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Oppure:**
- Verifica sessione Firebase Admin
- Controlla che user.role === 'admin'

---

### 8. Validazione Schema JSON

**Opzionale ma raccomandato:**
- Validare JSON prima di salvare
- Verificare che tutti i campi required siano presenti
- Verificare tipi corretti

**Libreria suggerita:** Zod
```typescript
import { z } from 'zod';

const ReportConfigSchema = z.object({
  title: z.string(),
  query: z.string(),
  columns: z.array(z.object({
    field: z.string(),
    label: z.string(),
    // ...
  })),
  // ...
});

// In API route:
const validated = ReportConfigSchema.parse(config);
```

---

### 9. Preview Report dal Wizard

**Feature suggerita:**
- Bottone "Anteprima" in Step 5
- Apre modal con preview del report
- Usa dati mock o query test
- Permette di vedere come apparirà prima di salvare

---

### 10. ReportBuilder - Implementazione Completa

**Attualmente:** ReportBuilder esiste ma potrebbe non gestire:
- Raggruppamenti gerarchici
- Totali/subtotali
- Filtri dinamici
- Paginazione server-side

**Da verificare/completare:**
- `frontend/components/reports/ReportBuilder.tsx`
- `frontend/lib/report-engine.ts`

---

## 🐛 PROBLEMI RISOLTI

### 1. Monaco Editor SSR Error ✅
**Errore:** `Monaco initialization: error 0`

**Causa:** Monaco Editor non compatibile con Server-Side Rendering di Next.js

**Soluzione:** Creato `SimpleJsonEditor.tsx` con textarea + validazione manuale
- Niente dipendenze esterne problematiche
- Funziona perfettamente con Next.js
- Stesse feature essenziali (validazione, formattazione, copia)

---

### 2. CORS durante test query ✅
**Errore:** `Failed to fetch` da localhost a shop.didieffeb2b.com

**Causa:** Browser blocca richieste cross-origin

**Soluzione:** API Route Next.js come proxy (`/api/test-query`)
- Fetch server-side (no CORS)
- Mock Mode automatico se backend non disponibile

---

### 3. Wizard non carica dati in edit mode ✅
**Problema:** Quando modifichi report, campi vuoti

**Causa:** Wizard non caricava query-config.json associata

**Soluzione:**
```typescript
useEffect(() => {
  if (report && report.query) {
    loadQueryData(report.query);
  }
}, [report]);
```

---

### 4. Campo codice cliente - approccio parametro SQL ❌
**Tentativo iniziale:** Dropdown parametri query in Step 5

**Problema:** Confuso, non user-friendly

**Soluzione finale:** Radio button in Step 2 accanto ai campi
- Più intuitivo
- Vedi direttamente quale campo stai selezionando
- Evidenziazione visiva del campo scelto

---

## 📝 NOTE TECNICHE

### Mock Mode - Come Funziona

**Attivazione automatica quando:**
- Backend PHP non raggiungibile (404)
- Query non trovata in config remoto
- Errori generici del backend

**Processo:**
1. Riceve query slug + SQL (se fornito)
2. Se SQL non fornito, cerca in `query-config.json` locale
3. Estrae colonne dal SELECT con regex:
   ```typescript
   const selectMatch = sql.match(/SELECT\s+(.*?)\s+FROM/is);
   const columns = selectClause.split(',').map(col => {
     // Estrae alias o nome campo
   });
   ```
4. Genera riga di dati mock basata su naming:
   - Se contiene "date" → `"2024-01-15"`
   - Se contiene "total" → `1234.56`
   - Se contiene "id" → `123`
   - Default → `"Sample ${field}"`

5. Ritorna formato standard:
   ```json
   {
     "success": true,
     "data": [mockRow],
     "_mock": true,
     "_note": "Backend not deployed..."
   }
   ```

---

### Workflow Traduzione Label

**Endpoint esistente:** `/api/translate-email-template`

**Input:**
```json
{
  "subject": "Label1\nLabel2\nLabel3",
  "targetLanguages": ["en", "de", "fr", "es", "pt"]
}
```

**Output:**
```json
{
  "success": true,
  "translations": [
    {
      "language": "en",
      "subject": "Translation1\nTranslation2\nTranslation3"
    },
    // ...
  ]
}
```

**Processo nel Wizard:**
1. Raccoglie tutte le label colonne
2. Join con `\n`
3. Chiama API
4. Split risultati
5. Trasforma label da string a object:
   ```typescript
   label: {
     it: "Etichetta originale",
     en: "Original label",
     de: "Ursprüngliche Beschriftung",
     // ...
   }
   ```

---

### Dual Config System

**Perché due file?**

1. **query-config.json** - Definizioni SQL pure
   - Riutilizzabili tra più report
   - Query "atomiche" generiche
   - Parametrizzate e sicure

2. **report-config.json** - Configurazioni visualizzazione
   - Specifiche per ogni report
   - Riferiscono query tramite slug
   - Aggiungono layer di presentazione

**Esempio:**
```json
// query-config.json
{
  "customer_orders": { "sql": "SELECT ...", "params": {...} }
}

// report-config.json
{
  "report_ordini_b2b": {
    "query": "customer_orders",  // ← Riferimento
    "title": "Ordini Clienti B2B",
    "columns": [...],
    "clientCodeField": "cod_cliente"
  },
  "report_ordini_b2c": {
    "query": "customer_orders",  // ← Stessa query!
    "title": "Ordini Consumatori",
    "columns": [...]  // ← Colonne diverse!
  }
}
```

**Vantaggio:** Una query, N report con visualizzazioni diverse

---

## 🚀 PROSSIMI PASSI CONSIGLIATI

### Immediato (Sessione corrente o prossima):

1. **Test completo wizard:**
   - Crea report da zero
   - Modifica report esistente
   - Testa JSON editor
   - Verifica tutto funzioni

2. **Implementa filtro automatico codice cliente:**
   - Modifica ReportBuilder.tsx
   - Passa clientCodeField ai parametri query
   - Testa con utente B2B

3. **Deploy query-config.json aggiornato:**
   - Verifica che contenga query "ee" salvata dal wizard
   - Carica su SiteGround
   - Testa backend reale (no mock mode)

### Breve termine:

4. **Aggiungi autenticazione API routes**
5. **Implementa traduzione completa (non solo colonne)**
6. **Test report in area clienti con utente B2B reale**

### Lungo termine:

7. **Implementa Step 3 (Raggruppamenti)** - se necessario
8. **Implementa Step 4 (Filtri utente)** - se necessario
9. **Preview report nel wizard**
10. **Export PDF/Excel funzionante**

---

## 🎓 CONOSCENZE CHIAVE

### TypeScript Types Principali:

```typescript
// types/report.ts

interface ReportConfig {
  title: string;
  description?: string;
  query: string;                    // Slug query da query-config.json
  columns: ReportColumn[];
  grouping?: ReportGrouping[];
  filters?: ReportFilter[];
  sorting?: ReportSorting;
  export?: ReportExportOptions;
  clientTypes?: ('b2b' | 'b2c')[];  // Filtro role-based
  enabled?: boolean;                // Abilita/disabilita report
  clientCodeField?: string;         // ⭐ Campo codice cliente
}

interface ReportColumn {
  field: string;                    // Nome campo DB
  label: string | MultiLangLabel;   // Etichetta (string o multilingua)
  type: 'string' | 'number' | 'currency' | 'date' | 'boolean';
  visible: boolean;
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: string;
  aggregate?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

interface QueryConfig {
  description: string;
  sql: string;                      // Query con :paramName placeholders
  params: Record<string, QueryParam>;
}

interface QueryParam {
  type: 'string' | 'int' | 'float' | 'date' | 'boolean';
  required: boolean;
  default?: any;
}
```

---

## 📊 QUERY ESEMPIO

```json
{
  "storia_ordini_righe": {
    "description": "Storico righe ordini cliente",
    "sql": "SELECT NGL_DOC_ORD, DTT_ORD, CDS_CAUM, CKY_CNT_CLFR, CDS_CNT_RAGSOC, CKY_CNT_AGENTE, Nome_Agente, CKY_ART, descrizione_Art, Quantita, Valore, sda_trasf, serie_trasf, Numero_trasf, Data_trasf, ORIGINE, STATO_RIGA, ID_DOC_ORIG, ID_DOC_TRASF, sco_1, sco_2, sco_3, np2_unit FROM V_B2B_STORIA_ORDINI_RIGHE WHERE CKY_CNT_CLFR = :clientCode",
    "params": {
      "clientCode": {
        "type": "string",
        "required": true
      }
    }
  }
}
```

---

## 🔗 RIFERIMENTI

**Documentazione esistente:**
- `SESSION_NOTES_REPORT_WIZARD.md` (vecchia - deprecata)
- Questo file è la versione aggiornata e completa

**Componenti chiave da consultare:**
- `ReportWizard.tsx` - Logica wizard completa
- `SimpleJsonEditor.tsx` - Editor JSON
- `types/report.ts` - Tutti i tipi TypeScript
- `execute-query.php` - Backend MySQL executor

**API esistenti da usare:**
- `/api/translate-email-template` - Traduzioni Claude AI
- `/api/reports/config` - CRUD report
- `/api/queries/config` - CRUD query
- `/api/test-query` - Test + mock mode

---

## ✅ CHECKLIST PRE-PRODUZIONE

Prima di considerare il sistema pronto per la produzione:

- [ ] Test wizard completo (create + edit)
- [ ] Test JSON editor (edit + save)
- [ ] Implementato filtro automatico codice cliente
- [ ] Backend deployato su SiteGround
- [ ] Query-config.json sincronizzato
- [ ] Testato con utente B2B reale
- [ ] Testato con utente B2C reale
- [ ] Autenticazione API routes implementata
- [ ] Traduzioni complete (non solo colonne)
- [ ] Export PDF/Excel funzionante
- [ ] Gestione errori robusta
- [ ] Logging appropriato
- [ ] Documentazione per utenti finali

---

**Fine note sessione 8 Novembre 2025**

Sistema report dinamici funzionante al 90% 🎉
Manca principalmente: implementare filtro automatico codice cliente nel ReportBuilder.
