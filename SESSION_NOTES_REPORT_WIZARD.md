# 📋 Note Sessione - Report Wizard System
**Data:** 7 Novembre 2025
**Stato:** Sistema di gestione report dinamici con Wizard - Base completata

---

## ✅ Completato Oggi

### 1. Sistema Report Dinamici (Base)
- ✅ **API Routes** per gestire configurazioni:
  - `/api/reports/config` - Gestione report-config.json (GET, POST, DELETE)
  - `/api/queries/config` - Gestione query-config.json (GET, POST, DELETE)

- ✅ **Types aggiornati** (`types/report.ts`):
  - Aggiunto `clientTypes?: ('b2b' | 'b2c')[]` per filtrare per tipo utente
  - Aggiunto `enabled?: boolean` per abilitare/disabilitare report

### 2. Area Clienti
- ✅ `/my-account/reports/page.tsx` - Lista report disponibili
- ✅ `/my-account/reports/[slug]/page.tsx` - Visualizzazione report specifico
- ✅ Filtri automatici basati su ruolo utente (B2B/B2C)
- ✅ Controlli permessi e clientCode

### 3. Admin Panel - Wizard (5 Step)
- ✅ **Layout base** con progress bar visiva
- ✅ **Step 1 - Query SQL**:
  - Input query slug, SQL, descrizione
  - Bottone "Test Query" con auto-discovery campi DB
  - Named parameters supportati (`:clientCode`, `:dateFrom`, etc.)
  - Validazione e feedback visivo

- ✅ **Step 2 - Colonne** (base):
  - Auto-popolato dai campi rilevati dalla query
  - Placeholder per traduzione Claude AI

- ✅ **Step 3 - Raggruppamenti** (placeholder)
- ✅ **Step 4 - Filtri** (placeholder)
- ✅ **Step 5 - Riepilogo**:
  - Metadati report (slug, titolo, descrizione)
  - Tipologie cliente (B2B/B2C checkboxes)
  - Abilitazione report
  - Salvataggio finale in entrambi i JSON

### 4. Navigazione e Integrazione
- ✅ Link "Reports" nel menu admin
- ✅ Card "Report Clienti" nel dashboard admin
- ✅ Lista report con azioni (Abilita/Disabilita, Modifica, Elimina)
- ✅ Badge per tipologie cliente e stato

---

## 🚧 Da Completare (Prossima Sessione)

### ⭐ NUOVO APPROCCIO IBRIDO: Wizard + JSON Editor + Claude Code

**Strategia a 3 Fasi:**

#### **Fase 1: Creazione Rapida (Wizard Semplificato)**
- [ ] Step 1: Query SQL + test → rileva campi automaticamente
- [ ] Step 2: Configurazione minimale colonne (solo label base, tipo)
- [ ] Step 3: (Opzionale) Raggruppamenti base
- [ ] Step 4: (Opzionale) Filtri base
- [ ] Step 5: Metadati + salva
- [ ] **Obiettivo:** Creare struttura base velocemente

#### **Fase 2: Modifica Avanzata (JSON Editor) ⭐ PRIORITÀ**
**Bottone "📝 Modifica JSON" nella lista report:**

Implementare:
- [ ] Modal/Pagina dedicata con **Monaco Editor** (syntax highlighting)
- [ ] Visualizza in 2 pannelli affiancati:
  - `query-config.json` (query SQL + params)
  - `report-config.json` (colonne, grouping, filters, export)
- [ ] **Features editor:**
  - Syntax highlighting JSON
  - Auto-complete per campi noti
  - Validazione real-time (schema validation)
  - Line numbers
  - Find & Replace
  - Format/Beautify JSON
- [ ] Bottoni:
  - "💾 Salva" → Valida + salva entrambi i JSON
  - "🔄 Ripristina" → Annulla modifiche
  - "📋 Copia JSON" → Per dare a Claude Code
  - "✅ Valida" → Test sintassi + struttura
  - "👁️ Preview Report" (opzionale) → Test con dati dummy

#### **Fase 3: AI Enhancement (Claude Code Integration)**
**Workflow:**
1. Clicca "📋 Copia JSON" nell'editor
2. Apri Claude Code
3. Dai prompt tipo:
   - "Aggiungi colonna calcolata per IVA (totale * 0.22)"
   - "Crea raggruppamento per trimestre basato su campo data"
   - "Formatta tutti i prezzi con simbolo € e 2 decimali"
   - "Aggiungi filtro daterange per periodo"
4. Claude Code modifica il JSON
5. Copia risultato → Incolla nell'editor
6. Preview → Salva

**Vantaggi Approccio:**
- ✅ **Wizard** = Veloce per creare base (80% casi uso)
- ✅ **JSON Editor** = Controllo totale per power user
- ✅ **Claude Code** = AI per modifiche complesse/bulk
- ✅ Flessibilità massima + velocità

### 1. Editor Colonne Base (Step 2) - SEMPLIFICATO
**Configurazione minimale nel wizard:**
- [ ] Tabella semplice con campi rilevati
- [ ] Per ogni colonna: solo Label e Tipo
- [ ] Visibilità on/off
- [ ] **Resto configurabile nel JSON Editor**

### 2. Editor Raggruppamenti Base (Step 3) - SEMPLIFICATO
- [ ] Selezione campo + label
- [ ] **Resto configurabile nel JSON Editor**

### 3. Editor Filtri Base (Step 4) - SEMPLIFICATO
- [ ] Campo + tipo filtro base
- [ ] **Resto configurabile nel JSON Editor**

### 4. Sistema Traduzione Centralizzato ⭐
**Invece di tradurre passo per passo, fare UN UNICO BOTTONE alla fine:**

#### **Posizione:** Step 5 (Riepilogo) o Step finale dedicato
#### **Bottone:** "🌍 Traduci Report (IT → EN, DE, FR, ES, PT)"

#### **Cosa traduce in una chiamata:**
1. **Titolo e Descrizione Report**
2. **Label Colonne** (tutte insieme)
3. **Label Raggruppamenti** (se presenti)
4. **Label Filtri** (se presenti)
5. **Qualsiasi altro testo** mostrato agli utenti finali

#### **Implementazione:**
```typescript
// API call to /api/translate-template with:
{
  sourceSubject: "Titolo Report\nLabel Col1\nLabel Col2\nLabel Gruppo1\nLabel Filtro1...",
  sourceBody: "Descrizione Report",
  targetLanguages: ['en', 'de', 'fr', 'es', 'pt']
}

// Result: transform single-lang labels into multilang objects
// Before: { label: "Totale" }
// After:  { label: { it: "Totale", en: "Total", de: "Gesamt", ... } }
```

#### **Vantaggi:**
- ✅ Una sola chiamata API invece di 10+
- ✅ Più veloce e coerente
- ✅ Utente può rivedere tutto prima di tradurre
- ✅ Può ripetere traduzione se modifica label

---

## 📁 Struttura File Progetto

```
frontend/
├── app/
│   ├── admin-panel/
│   │   └── reports/
│   │       ├── page.tsx                    # Lista report (COMPLETO)
│   │       ├── ReportWizard.tsx            # Wizard 5 step (BASE)
│   │       └── ReportFormAdvanced.tsx      # Vecchio form (deprecato)
│   ├── my-account/
│   │   └── reports/
│   │       ├── page.tsx                    # Lista report clienti (COMPLETO)
│   │       └── [slug]/page.tsx             # Visualizzazione report (COMPLETO)
│   └── api/
│       ├── reports/
│       │   └── config/route.ts             # API report-config.json (COMPLETO)
│       └── queries/
│           └── config/route.ts             # API query-config.json (COMPLETO)
├── components/
│   └── reports/
│       ├── ReportBuilder.tsx               # Engine visualizzazione report (ESISTENTE)
│       ├── ReportTable.tsx                 # Tabella dati (ESISTENTE)
│       ├── ReportFilters.tsx               # Filtri utente (ESISTENTE)
│       └── ReportExport.tsx                # Export PDF/Excel/CSV (ESISTENTE)
├── lib/
│   ├── report-engine.ts                    # Logica processamento dati (ESISTENTE)
│   └── mysql-query.ts                      # Client per execute-query.php (ESISTENTE)
└── types/
    └── report.ts                            # Types TypeScript (AGGIORNATO)

admin/
├── api/
│   └── execute-query.php                   # Esecutore query MySQL (ESISTENTE)
└── data/
    ├── query-config.json                   # Query SQL + parametri (GESTITO VIA API)
    └── report-config.json                  # Config visualizzazione report (GESTITO VIA API)
```

---

## 🎯 Piano Prossima Sessione

### ⭐ PRIORITÀ 1: JSON Editor (Modifica Avanzata)
**Implementare prima di completare wizard dettagliato!**

1. **Installare Monaco Editor:**
   ```bash
   npm install @monaco-editor/react
   ```

2. **Creare componente `ReportJsonEditor.tsx`:**
   - Layout a 2 pannelli (query-config | report-config)
   - Monaco Editor con syntax highlighting
   - Validazione JSON real-time
   - Bottoni: Salva, Ripristina, Copia, Valida

3. **Aggiungere bottone "📝 Modifica JSON" in lista report:**
   - Apre modal/pagina dedicata
   - Carica entrambi i JSON dal backend
   - Permette modifica libera
   - Salva tramite API

4. **Schema Validation:**
   - Validare struttura JSON prima di salvare
   - Error messages chiari
   - Highlight errori nell'editor

### Priorità 2: Semplificare Wizard (Steps 2-3-4)
**Wizard diventa "Quick Start" minimalista:**

1. Step 2 (Colonne): Solo label + tipo + visibilità
2. Step 3 (Raggruppamenti): Solo campo + label base
3. Step 4 (Filtri): Solo campo + tipo
4. **Messaggio:** "Per configurazione avanzata, usa JSON Editor"

### Priorità 3: Traduzione Centralizzata
1. Aggiungere Step 6 "Traduzione" (opzionale) oppure bottone in Step 5
2. Raccogliere tutti i testi da tradurre:
   ```typescript
   const textsToTranslate = [
     reportTitle,
     reportDescription,
     ...columns.map(c => typeof c.label === 'string' ? c.label : c.label.it),
     ...grouping.map(g => g.label),
     ...filters.map(f => f.label),
   ];
   ```
3. Chiamare `/api/translate-template` una volta sola
4. Trasformare tutte le label da string → object multilingua
5. Preview traduzioni prima di salvare
6. Bottone "Applica Traduzioni"

### Priorità 4: Testing
1. Creare report di test end-to-end
2. Verificare salvataggio corretto in entrambi i JSON
3. Testare visualizzazione report in area clienti
4. Testare filtri B2B/B2C

---

## 🔧 Architettura Sistema

### Flusso Creazione Report:

```
1. Admin entra nel Wizard
   ↓
2. Step 1: Scrive/seleziona query SQL
   → Clicca "Test Query"
   → Sistema esegue query con params dummy
   → Recupera struttura campi dal risultato
   → Auto-crea colonne base
   ↓
3. Step 2: Modifica configurazione colonne
   → Label, tipo, formato, aggregazione, etc.
   ↓
4. Step 3: (Opzionale) Definisce raggruppamenti
   ↓
5. Step 4: (Opzionale) Definisce filtri utente
   ↓
6. Step 5: Metadati report + tipologie cliente
   → [NUOVO] Bottone "Traduci Report"
   → Sistema raccoglie tutti i testi
   → Chiama Claude AI una volta
   → Applica traduzioni a tutto
   ↓
7. Salvataggio finale:
   → POST /api/queries/config → salva query-config.json
   → POST /api/reports/config → salva report-config.json
```

### Flusso Visualizzazione Report (Clienti):

```
1. Cliente B2B/B2C accede a /my-account/reports
   ↓
2. Sistema carica tutti i report
   → Filtra per clientTypes (B2B/B2C)
   → Filtra per enabled = true
   → Mostra solo report autorizzati
   ↓
3. Cliente clicca su un report
   → Vai a /my-account/reports/[slug]
   → Controllo autorizzazioni
   → Carica report-config.json
   → Esegue query SQL via execute-query.php
   → Usa ReportEngine per processare dati
   → Mostra con ReportTable + filtri + export
```

---

## 🐛 Bug Noti / Da Verificare

- [ ] Fast Refresh error nel browser (non bloccante, refresh manuale funziona)
- [ ] Validazione parametri query (attualmente usa params dummy per test)
- [ ] Gestione errori query SQL malformate
- [ ] Timeout per query lunghe (attualmente no limit)

---

## 💡 Idee Future (Backlog)

### Funzionalità Avanzate:
- [ ] **Query Builder Visuale** invece di SQL manuale
- [ ] **Preview Dati Real-Time** durante configurazione
- [ ] **Template Report** pre-configurati (es: "Documenti Cliente Standard")
- [ ] **Duplica Report** per creare varianti velocemente
- [ ] **Versioning Report** (salva storico modifiche)
- [ ] **Scheduling Report** (es: invio automatico via email)
- [ ] **Report con JOIN** multipli (attualmente solo query singola)
- [ ] **Grafici** oltre alle tabelle (chart.js integration)

### UX Miglioramenti:
- [ ] Drag & drop query da libreria preesistente
- [ ] Import/Export configurazione report (JSON download/upload)
- [ ] Preview report in modal prima di salvare
- [ ] Undo/Redo nello wizard
- [ ] Salvataggio bozze automatico (localStorage)

---

## 📚 Risorse e Documentazione

### API Endpoints Disponibili:
- `GET /api/reports/config` - Lista tutti i report
- `GET /api/reports/config?slug=xxx` - Report specifico
- `POST /api/reports/config` - Salva/aggiorna report
- `DELETE /api/reports/config?slug=xxx` - Elimina report
- `GET /api/queries/config` - Lista tutte le query
- `POST /api/queries/config` - Salva/aggiorna query
- `POST /api/translate-template` - Traduzione Claude AI (esistente)
- `POST ${BACKEND_URL}/admin/api/execute-query.php` - Esegue query MySQL

### File Configurazione:
- `admin/data/query-config.json` - Query SQL + parametri
- `admin/data/report-config.json` - Configurazione visualizzazione

### Componenti Riutilizzabili:
- `ReportEngine.processReport()` - Elaborazione dati con grouping/aggregation
- `ReportTable` - Rendering tabella con supporto gerarchie
- `ReportFilters` - Filtri utente con vari tipi input

---

## 🎨 Design System

### Colori Wizard:
- **Step Attivo:** Blue (`bg-blue-600`, `text-blue-600`)
- **Step Completato:** Green (`bg-green-500`, `text-green-500`)
- **Step Non Iniziato:** Gray (`bg-gray-300`, `text-gray-400`)

### Bottoni Azione:
- **Test Query:** Green (`bg-green-600`)
- **Traduci:** Purple (`bg-purple-600`)
- **Salva:** Green (`bg-green-600`)
- **Avanti:** Blue (`bg-blue-600`)

### Icone per Step:
- Database: Query SQL
- Table: Colonne
- Layers: Raggruppamenti
- Filter: Filtri
- CheckCircle: Riepilogo

---

## ⚙️ Configurazione Ambiente

### Variabili .env.local:
```bash
NEXT_PUBLIC_API_URL=https://shop.didieffeb2b.com
NEXT_PUBLIC_BACKEND_URL=https://shop.didieffeb2b.com
ADMIN_API_TOKEN=<token>  # Per autenticazione API (da implementare)
```

### Server Locale:
- **Next.js:** http://localhost:3000
- **Turbopack:** Enabled (fast refresh)

---

## 🚀 Come Riprendere Domani

1. **Aprire progetto:**
   ```bash
   cd C:\Users\pelli\claude\ecommerce\frontend
   npm install @monaco-editor/react  # Se non già installato
   npm run dev
   ```

2. **Aprire browser:**
   - Admin: http://localhost:3000/admin-panel/reports
   - Clicca "Nuovo Report" → Vedrai wizard base

3. **⭐ PRIORITÀ LAVORO (nuovo approccio):**

   **PRIMA: JSON Editor** (più importante!)
   - Creare `ReportJsonEditor.tsx` con Monaco Editor
   - Aggiungere bottone "📝 Modifica JSON" in lista report
   - Implementare validazione + salvataggio
   - Testare workflow: crea via wizard → modifica JSON → salva

   **POI: Semplificare Wizard**
   - Ridurre Step 2-3-4 a configurazione minimale
   - Aggiungere messaggi "Usa JSON Editor per config avanzata"

   **INFINE: Traduzione**
   - Bottone centralizzato nello Step 5

4. **File da creare/modificare:**
   - ✨ **NUOVO:** `frontend/app/admin-panel/reports/ReportJsonEditor.tsx`
   - Modificare: `frontend/app/admin-panel/reports/page.tsx` (aggiungi bottone)
   - Semplificare: `frontend/app/admin-panel/reports/ReportWizard.tsx` (Step 2-3-4)

5. **Workflow di test:**
   ```
   1. Crea report base con wizard
   2. Clicca "Modifica JSON"
   3. Vedi entrambi i JSON side-by-side
   4. Modifica manualmente
   5. Copia JSON → Dai a Claude Code per modifiche AI
   6. Incolla risultato → Salva
   7. Verifica report funziona in /my-account/reports
   ```

---

**Fine Note - Buona Fortuna! 🎉**

*Sistema report dinamici con wizard base funzionante. Prossimi step: completare editor dettagliati e traduzione centralizzata.*
