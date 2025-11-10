'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Save, Eye, Clock, CheckCircle } from 'lucide-react';

interface ComponentVersion {
  id: string;
  timestamp: string;
  note: string;
  code: string;
}

interface ComponentVersions {
  active: string;
  versions: ComponentVersion[];
}

interface ComponentCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALLOWED_COMPONENTS = [
  { value: 'ReportTable', label: '📊 Tabella Report', description: 'Griglia con dati, colonne, righe' },
  { value: 'ReportFilters', label: '🔍 Filtri Report', description: 'Form filtri (date, select, bottoni)' },
  { value: 'ReportExport', label: '📥 Export Report', description: 'Bottoni Excel, PDF, CSV' },
  { value: 'ReportBuilder', label: '🏗️ Report Builder', description: 'Contenitore principale (header, lingua)' },
];

const AI_INSTRUCTIONS = `
# ISTRUZIONI PER AI - Personalizzazione Componente UI Report

## 🎯 FORMATO OUTPUT - LEGGERE PRIMA DI TUTTO!

**ATTENZIONE CRITICA**: La tua risposta DEVE iniziare IMMEDIATAMENTE con il code block TypeScript.
NON scrivere NULLA prima del code block. Nessuna frase introduttiva, nessuna spiegazione.

**❌ VIETATO ASSOLUTAMENTE:**
- "Perfetto, Andrea..."
- "Ho preso tutto il tuo blocco..."
- "Ecco il codice modificato..."
- "Ho normalizzato secondo le tue regole..."
- Commenti sopra i separatori tipo "// (spostato dentro...)"
- Qualsiasi testo prima o dopo il code block

**✅ OUTPUT VALIDO (UNICO FORMATO ACCETTATO):**

INIZIO RISPOSTA ↓
\`\`\`typescript
// ============================================================
// COMPONENTE: ReportTable
// FILE: components/reports/ReportTable.tsx
// ============================================================

'use client';
[... resto del codice ...]
\`\`\`
FINE RISPOSTA ↑

**Se la tua risposta contiene anche solo UNA parola prima del \`\`\`typescript, verrà SCARTATA.**

Se hai ricevuto COMPONENTI MULTIPLI con separatori, mantienili TUTTI e restituisci TUTTO IL CODICE con i separatori.

---

## 🌍 LINGUE OBBLIGATORIE - NON DIMENTICARE!

**Questo sistema è MULTILINGUA. OGNI testo hardcoded DEVE essere tradotto in TUTTE le 9 lingue:**

1. **it** = Italiano
2. **en** = English
3. **de** = Deutsch (Tedesco)
4. **fr** = Français (Francese)
5. **es** = Español (Spagnolo)
6. **pt** = Português (Portoghese)
7. **hr** = Hrvatski (Croato)
8. **sl** = Slovenščina (Sloveno)
9. **el** = Ελληνικά (Greco)

**CRITICO**: Se modifichi componenti multipli, assicurati di tradurre OGNI componente in TUTTE e 9 le lingue!

---

## 📁 STRUTTURA DEI COMPONENTI

Potresti ricevere UN SINGOLO componente oppure TUTTI E 4 i componenti insieme.

Se ricevi TUTTI I COMPONENTI, troverai separatori visibili tipo:
\`\`\`
// ============================================================
// COMPONENTE: ReportTable
// FILE: components/reports/ReportTable.tsx
// ============================================================
\`\`\`

**IMPORTANTE quando ricevi componenti multipli:**
- Mantieni TUTTI i separatori ESATTAMENTE come sono (non modificarli, non rimuoverli)
- Modifica ciascun componente mantenendo COERENZA di stile tra tutti
- Restituisci tutto nello STESSO ORDINE con gli STESSI separatori
- Applica le stesse modifiche di stile/traduzione a **TUTTI i componenti**
- **TRADUCI ogni componente in TUTTE e 9 le lingue** (it, en, de, fr, es, pt, hr, sl, el)

## Cosa puoi modificare:
- Stili CSS (classi Tailwind)
- Layout e struttura HTML/JSX
- Animazioni e transizioni
- Dimensioni, spaziature, colori
- Responsive design
- **TUTTI i testi hardcoded** (bottoni, messaggi, labels, placeholder, etc.) - TRADUCILI in **9 lingue: it, en, de, fr, es, pt, hr, sl, el**

## Cosa NON devi modificare:
- **🚨 EXPORT DEFAULT** - MANTIENI SEMPRE \`export default function NomeComponente\` (NON rimuovere "default"!)
- La logica di business (funzioni, state management)
- Le props del componente
- I nomi delle funzioni callback (onChange, onApply, etc.)
- Le import esistenti
- La struttura dati (non cambiare come vengono processati i dati)
- Le chiamate a ReportEngine.formatValue() (vedi sotto)
- **I SEPARATORI tra componenti** (se presenti)

**⚠️ ATTENZIONE EXPORT**: Il componente DEVE avere \`export default\`, altrimenti causerà errori di build!

## ⭐ SISTEMA MULTILINGUA (CRITICO - LEGGI ATTENTAMENTE):

### Lingue supportate: **it, en, de, fr, es, pt, hr, sl, el** (TUTTE E 9 OBBLIGATORIE)

### Come gestire le traduzioni:

**1. TESTI HARDCODED del componente:**

**Questi vanno SEMPRE tradotti con TEXTS hardcoded (NON usare sistemi di traduzione esterni):**

🔴 **CRITICO - LABEL DA TRADURRE OBBLIGATORIAMENTE:**
- **LABEL dei filtri**: "Data Ordine", "Numero documento", "Codice Articolo", "Anno", "Tipo documento", "Cliente", etc.
- **LABEL delle colonne**: "Quantità", "Valore", "Prezzo", "Sconto", "Totale", "Data", "Numero", "Stato", etc.
- **LABEL dei raggruppamenti**: "Ordine", "Cliente", "Articolo", "Agente", etc.
- **LABEL degli header**: Titolo del report, descrizione del report
- Tutti i campi che vedi nell'interfaccia con testo italiano

🟡 **Altri testi da tradurre:**
- Bottoni (Esporta, Applica Filtri, Reset, Mostra, Nascondi, etc.)
- Messaggi (Caricamento..., Nessun dato, Errore, Successo, etc.)
- Placeholder (Cerca..., Seleziona..., Tutti, Da, A, etc.)
- Badge e stati (Consegnato, In Ordine, Evaso, Attivo, etc.)

**IMPORTANTE**: Le label arrivano dal config (filter.label, col.label, etc.) ma vanno **IGNORATE**.
Tu devi creare traduzioni hardcoded per TUTTE queste label!

**❌ ERRORE COMUNE - NON FARE COSÌ:**
\`\`\`typescript
// SBAGLIATO: usa ancora filter.label o col.label ❌
{filters.map((filter) => {
  const label = filter.label;  // ❌ NO!
  return <label>{label}</label>;
})}
\`\`\`

**✅ CORRETTO - FAI COSÌ:**
\`\`\`typescript
// 1. Crea TEXTS con tutte le label
const TEXTS = {
  filterAnno: { it: 'Anno', en: 'Year', de: 'Jahr', ... },
  filterCliente: { it: 'Cliente', en: 'Customer', de: 'Kunde', ... },
};

// 2. Usa TEXTS invece di filter.label ✅
{filters.map((filter) => {
  const labelKey = \`filter\${filter.field.charAt(0).toUpperCase() + filter.field.slice(1)}\`;
  const label = TEXTS[labelKey]?.[language] || filter.field;
  return <label>{label}</label>;
})}
\`\`\`

**Esempio completo:**
\`\`\`typescript
'use client';
import { ... } from '...';

// 👇 TEXTS object per TUTTE le traduzioni (bottoni, messaggi, LABEL, etc.)
const TEXTS = {
  // Bottoni
  exportButton: {
    it: 'Esporta',
    en: 'Export',
    de: 'Exportieren',
    fr: 'Exporter',
    es: 'Exportar',
    pt: 'Exportar'
  },
  // Messaggi
  noData: {
    it: 'Nessun dato disponibile',
    en: 'No data available',
    de: 'Keine Daten verfügbar',
    fr: 'Aucune donnée disponible',
    es: 'No hay datos disponibles',
    pt: 'Nenhum dato disponível'
  },
  // ⭐ LABEL DEI FILTRI - TRADUCILE QUI (non usare filter.label!)
  filterDataOrdine: {
    it: 'Data Ordine',
    en: 'Order Date',
    de: 'Bestelldatum',
    fr: 'Date Commande',
    es: 'Fecha Pedido',
    pt: 'Data Pedido'
  },
  filterNumeroDocumento: {
    it: 'Numero Documento',
    en: 'Document Number',
    de: 'Dokumentnummer',
    fr: 'Numéro Document',
    es: 'Número Documento',
    pt: 'Número Documento'
  },
  filterCodiceArticolo: {
    it: 'Codice Articolo',
    en: 'Item Code',
    de: 'Artikelcode',
    fr: 'Code Article',
    es: 'Código Artículo',
    pt: 'Código Artigo'
  },
  // ⭐ LABEL DELLE COLONNE - TRADUCILE QUI (non usare col.label!)
  columnQuantita: {
    it: 'Quantità',
    en: 'Quantity',
    de: 'Menge',
    fr: 'Quantité',
    es: 'Cantidad',
    pt: 'Quantidade'
  },
  columnValore: {
    it: 'Valore',
    en: 'Value',
    de: 'Wert',
    fr: 'Valeur',
    es: 'Valor',
    pt: 'Valor'
  },
  columnData: {
    it: 'Data',
    en: 'Date',
    de: 'Datum',
    fr: 'Date',
    es: 'Fecha',
    pt: 'Data'
  },
  // ⭐ LABEL DEI RAGGRUPPAMENTI
  groupOrdine: {
    it: 'Ordine',
    en: 'Order',
    de: 'Bestellung',
    fr: 'Commande',
    es: 'Pedido',
    pt: 'Pedido'
  },
  // ... aggiungi TUTTI i testi del componente
};

export default function MyComponent({ language = 'it', filters, columns, ... }) {
  return (
    <div>
      {/* Bottoni */}
      <button>{TEXTS.exportButton[language]}</button>

      {/* Label filtri - NON usare filter.label! */}
      {filters.map(filter => (
        <label key={filter.field}>
          {TEXTS[\`filter\${filter.field}\`][language]}
        </label>
      ))}

      {/* Label colonne - NON usare col.label! */}
      {columns.map(col => (
        <th key={col.field}>
          {TEXTS[\`column\${col.field}\`][language]}
        </th>
      ))}
    </div>
  );
}
\`\`\`

**2. DATI DA VISUALIZZARE (solo descrizioni prodotti):**
   - I dati arrivano dal database o da products.json
   - Campi con \`translatable: true\` nel ReportConfig contengono già traduzioni come:
     \`{ it: 'Descrizione ITA', en: 'Description ENG', de: 'Beschreibung DE', ... }\`
   - **USA SEMPRE ReportEngine.formatValue()** per renderizzare questi dati
   - Il motore cerca automaticamente la traduzione in base a \`language\`
   - Se non trova la traduzione, usa italiano come fallback

**Esempio rendering dati:**
\`\`\`typescript
// ✅ CORRETTO - usa formatValue
columns.map(col => (
  <td key={col.field}>
    {ReportEngine.formatValue(row[col.field], col, language)}
  </td>
))

// ❌ SBAGLIATO - renderizza direttamente
<td>{row[col.field]}</td>
\`\`\`

**3. PROPS DEL COMPONENTE:**
   - Se manca, aggiungi \`language?: string\` alle props con default 'it'
   - Passa sempre \`language\` a ReportEngine.formatValue()
   - Usa \`language\` per TEXTS

## ✅ Checklist prima di consegnare il codice:

- [ ] **🚨 EXPORT DEFAULT presente!** Deve essere \`export default function NomeComponente\` (CRITICO!)
- [ ] Componente inizia con 'use client'
- [ ] Creato oggetto TEXTS con TUTTE le traduzioni hardcoded in 6 lingue (it, en, de, fr, es, pt)
- [ ] **LABEL di filtri/colonne/raggruppamenti tradotte in TEXTS** (NON usare getFilterLabel, getColumnLabel)
- [ ] Tutti i bottoni/messaggi usano TEXTS[key][language]
- [ ] **Rimosso useReportTranslations** se presente (NON serve più)
- [ ] **Rimosso getTitle, getDescription, getFilterLabel, getColumnLabel, getGroupingLabel** se presenti
- [ ] Tutte le chiamate di rendering dati prodotti usano ReportEngine.formatValue(value, col, language)
- [ ] Props include \`language?: string\` con default 'it'
- [ ] Nessuna stringa hardcoded in italiano nel JSX
- [ ] Se componenti multipli: TUTTI tradotti in 6 lingue
- [ ] Separatori mantenuti intatti (se componenti multipli)
- [ ] Logica di business non modificata
- [ ] Import esistenti mantenuti

## 🚫 ERRORI COMUNI DA EVITARE:

❌ **Rimuovere "default" dall'export**: \`export function ReportTable(...)\`
✅ **Corretto**: \`export default function ReportTable(...)\`

❌ Testo hardcoded in italiano: \`<button>Esporta</button>\`
✅ Corretto: \`<button>{TEXTS.export[language]}</button>\`

❌ Usare label dal config senza tradurre: \`<label>{filter.label}</label>\`
✅ Corretto: \`<label>{TEXTS.filterName[language]}</label>\`

❌ Usare \`useReportTranslations\` o \`getFilterLabel\` o \`getColumnLabel\`
✅ Corretto: Crea TEXTS hardcoded e ignora il sistema di traduzione

❌ Rendering diretto dati articoli: \`<td>{row.descrizione}</td>\`
✅ Corretto: \`<td>{ReportEngine.formatValue(row.descrizione, col, language)}</td>\`

❌ Rimuovere language prop
✅ Mantenere e usare language in tutto il componente

❌ Dimenticare di tradurre uno o più componenti quando ne modifichi multipli
✅ Traduci OGNI componente in TUTTE e 9 le lingue

## 📝 RIEPILOGO VELOCE:

**🚨 REGOLA #1 - EXPORT DEFAULT:**
- ✅ Deve SEMPRE essere \`export default function NomeComponente\`
- ❌ NON rimuovere "default" (causerà errore di build!)

**Sistema di traduzione automatico (useReportTranslations, getColumnLabel, etc.):**
- ❌ NON ESISTE PIÙ - Rimuovilo se presente
- ❌ NON usare per label, bottoni, messaggi

**Cosa fare invece:**
- ✅ TEXTS hardcoded per TUTTO (label, bottoni, messaggi)
- ✅ ReportEngine.formatValue() SOLO per dati prodotti (descrizione articolo)
- ✅ Passa \`language\` prop a tutti i componenti
- ✅ Traduci in 6 lingue: it, en, de, fr, es, pt

**Output:**
- ✅ SOLO codice completo in un code block
- ❌ NO spiegazioni, NO note, NO commenti extra

---

## Codice del componente da modificare:
`;

const AI_TRANSLATION_INSTRUCTIONS = `
# ISTRUZIONI PER AI - SOLO TRADUZIONE MULTILINGUA

## 🎯 FORMATO OUTPUT - LEGGERE PRIMA DI TUTTO!

**ATTENZIONE CRITICA**: La tua risposta DEVE iniziare IMMEDIATAMENTE con il code block TypeScript.
NON scrivere NULLA prima del code block. Nessuna frase introduttiva, nessuna spiegazione.

**❌ VIETATO ASSOLUTAMENTE:**
- "Perfetto, Andrea..."
- "Ho preso tutto il tuo blocco..."
- "Ecco il codice modificato..."
- "Ho normalizzato secondo le tue regole..."
- "niente config.title / config.description..."
- Commenti sopra i separatori tipo "// (spostato dentro...)"
- Qualsiasi testo prima o dopo il code block

**✅ OUTPUT VALIDO (UNICO FORMATO ACCETTATO):**

INIZIO RISPOSTA ↓
\`\`\`typescript
// ============================================================
// COMPONENTE: ReportTable
// FILE: components/reports/ReportTable.tsx
// ============================================================

'use client';
[... resto del codice ...]
\`\`\`
FINE RISPOSTA ↑

**Se la tua risposta contiene anche solo UNA parola prima del \`\`\`typescript, verrà SCARTATA.**

Se hai ricevuto COMPONENTI MULTIPLI con separatori, mantienili TUTTI e restituisci TUTTO IL CODICE con i separatori.

---

## 🎯 OBIETTIVO: TRADURRE TESTI SENZA MODIFICARE NULLA ALTRO

**La tua unica missione è TRADURRE i testi hardcoded in 6 lingue. NON modificare grafiche, stili o logica!**

---

## 🚨 REGOLA FONDAMENTALE - LEGGERE PRIMA DI INIZIARE:

**NON USARE MAI col.label, filter.label, group.label o config.title DIRETTAMENTE NEL JSX!**

Questi valori arrivano dal database come stringhe semplici in italiano.
Tu DEVI:
1. ✅ Creare un oggetto TEXTS con TUTTE le traduzioni (it, en, de, fr, es, pt)
2. ✅ Sostituire OGNI riferimento a col.label/filter.label/etc con TEXTS.qualcosa[language]
3. ✅ Assicurarti che OGNI label abbia la sua traduzione in TEXTS

**Se vedi ANCORA col.label o filter.label nel codice finale, hai sbagliato!**

---

## 📋 COSA FARE ESATTAMENTE:

### 1️⃣ ANALIZZA tutte le label presenti nel componente

Prima di scrivere codice, identifica TUTTE le label che devono essere tradotte:

**Nel componente troverai:**
- \`filter.label\` → Label dei filtri (es: "Data Ordine", "Anno", "Cliente")
- \`col.label\` → Label delle colonne (es: "Quantità", "Valore", "Prezzo")
- \`group.label\` → Label dei raggruppamenti (es: "Ordine", "Articolo")
- \`config.title\`, \`config.description\` → Titolo e descrizione del report
- Stringhe hardcoded → Bottoni, messaggi, placeholder, etc.

**Fai una lista mentale di TUTTE queste label PRIMA di iniziare.**

### 2️⃣ CREA oggetto TEXTS COMPLETO con traduzioni

All'inizio del componente (dopo imports, prima della funzione), crea un oggetto TEXTS che contiene:
- ✅ TUTTE le label dei filtri
- ✅ TUTTE le label delle colonne
- ✅ TUTTE le label dei raggruppamenti
- ✅ Tutti i bottoni/messaggi/placeholder
- ✅ Titolo e descrizione (se presenti)

**Ogni voce DEVE avere TUTTE e 9 le lingue: it, en, de, fr, es, pt, hr, sl, el**

\`\`\`typescript
const TEXTS = {
  // ====== LABEL FILTRI - UNA VOCE PER OGNI filter.field ======
  filterDataOrdine: {
    it: 'Data Ordine',
    en: 'Order Date',
    de: 'Bestelldatum',
    fr: 'Date de Commande',
    es: 'Fecha de Pedido',
    pt: 'Data do Pedido'
  },
  filterAnno: {
    it: 'Anno',
    en: 'Year',
    de: 'Jahr',
    fr: 'Année',
    es: 'Año',
    pt: 'Ano'
  },
  // ... CONTINUA per OGNI filtro presente nel componente

  // ====== LABEL COLONNE - UNA VOCE PER OGNI col.field ======
  columnQuantita: {
    it: 'Quantità',
    en: 'Quantity',
    de: 'Menge',
    fr: 'Quantité',
    es: 'Cantidad',
    pt: 'Quantidade'
  },
  columnValore: {
    it: 'Valore',
    en: 'Value',
    de: 'Wert',
    fr: 'Valeur',
    es: 'Valor',
    pt: 'Valor'
  },
  columnNumeroOrdine: {
    it: 'Numero Ordine',
    en: 'Order Number',
    de: 'Bestellnummer',
    fr: 'Numéro de Commande',
    es: 'Número de Pedido',
    pt: 'Número do Pedido'
  },
  // ... CONTINUA per OGNI colonna presente nel componente

  // ====== LABEL RAGGRUPPAMENTI (se presenti) ======
  groupOrdine: {
    it: 'Ordine',
    en: 'Order',
    de: 'Bestellung',
    fr: 'Commande',
    es: 'Pedido',
    pt: 'Pedido'
  },
  // ... CONTINUA per OGNI raggruppamento

  // ====== TITOLI E DESCRIZIONI REPORT (se presenti) ======
  reportTitle: {
    it: 'Analisi Vendite',
    en: 'Sales Analysis',
    de: 'Verkaufsanalyse',
    fr: 'Analyse des Ventes',
    es: 'Análisis de Ventas',
    pt: 'Análise de Vendas'
  },

  // ====== UI GENERALE (bottoni, messaggi, etc.) ======
  buttonExport: {
    it: 'Esporta',
    en: 'Export',
    de: 'Exportieren',
    fr: 'Exporter',
    es: 'Exportar',
    pt: 'Exportar'
  },
  messageLoading: {
    it: 'Caricamento dati...',
    en: 'Loading data...',
    de: 'Daten werden geladen...',
    fr: 'Chargement des données...',
    es: 'Cargando datos...',
    pt: 'Carregando dados...'
  },
  // ... TUTTI gli altri testi UI
};
\`\`\`

### 3️⃣ SOSTITUISCI TUTTI i riferimenti nel JSX

**⚠️ ATTENZIONE - ERRORE FREQUENTE:**
Molte volte l'AI crea l'oggetto TEXTS ma poi **DIMENTICA DI USARLO** nel codice!

**ESEMPIO SBAGLIATO (COMUNE):**
\`\`\`typescript
const TEXTS = {
  filterAnno: { it: 'Anno', en: 'Year', de: 'Jahr', ... },
  // ... altre voci
};

// ERRORE: filter.label viene ancora usato qui! ❌
{filters.map((filter) => {
  const label = filter.label;  // ❌ SBAGLIATO!
  return <label>{label}</label>;
})}
\`\`\`

**CORRETTO:**
\`\`\`typescript
const TEXTS = {
  filterAnno: { it: 'Anno', en: 'Year', de: 'Jahr', ... },
  // ... altre voci
};

// CORRETTO: usa TEXTS invece di filter.label ✅
{filters.map((filter) => {
  const labelKey = \`filter\${filter.field.charAt(0).toUpperCase() + filter.field.slice(1)}\`;
  const label = TEXTS[labelKey]?.[language] || filter.field;
  return <label>{label}</label>;
})}
\`\`\`

**📍 PUNTI DOVE CONTROLLARE:**
- \`const label = filter.label\` → Cambia in \`const label = TEXTS.filter...[language]\`
- \`const label = col.label\` → Cambia in \`const label = TEXTS.column...[language]\`
- \`<label>{filter.label}</label>\` → Cambia in \`<label>{TEXTS.filter...[language]}</label>\`

Cerca e sostituisci **OGNI SINGOLO** pattern nel codice:

**❌ PATTERN DA ELIMINARE COMPLETAMENTE:**
- \`{col.label}\`
- \`{filter.label}\`
- \`{group.label}\`
- \`{config.title}\`
- \`{config.description}\`
- \`"testo italiano hardcoded"\`
- \`'testo italiano hardcoded'\`

**✅ SOSTITUISCI CON:**
- \`{TEXTS.columnNomeCampo[language]}\`
- \`{TEXTS.filterNomeCampo[language]}\`
- \`{TEXTS.groupNomeCampo[language]}\`
- \`{TEXTS.reportTitle[language]}\`
- \`{TEXTS.qualcosa[language]}\`

**ESEMPI CONCRETI:**

\`\`\`typescript
// ❌ SBAGLIATO - usa col.label direttamente
{columns.map((col) => (
  <th key={col.field}>{col.label}</th>
))}

// ✅ CORRETTO - mapping dinamico a TEXTS
{columns.map((col) => {
  const labelKey = \`column\${col.field.charAt(0).toUpperCase() + col.field.slice(1)}\`;
  return <th key={col.field}>{TEXTS[labelKey]?.[language] || col.field}</th>;
})}
\`\`\`

\`\`\`typescript
// ❌ SBAGLIATO - usa filter.label direttamente
{filters.map((filter) => (
  <label>{filter.label}</label>
))}

// ✅ CORRETTO - mapping dinamico a TEXTS
{filters.map((filter) => {
  const labelKey = \`filter\${filter.field.charAt(0).toUpperCase() + filter.field.slice(1)}\`;
  return <label>{TEXTS[labelKey]?.[language] || filter.field}</label>;
})}
\`\`\`

\`\`\`typescript
// ❌ SBAGLIATO - config.title direttamente
<h1>{config.title}</h1>

// ✅ CORRETTO - usa TEXTS
<h1>{TEXTS.reportTitle[language]}</h1>
\`\`\`

\`\`\`typescript
// ❌ SBAGLIATO - testo hardcoded
<button>Esporta in Excel</button>

// ✅ CORRETTO - usa TEXTS
<button>{TEXTS.buttonExportExcel[language]}</button>
\`\`\`

### 4️⃣ AGGIUNGI prop language (se manca)

Se il componente NON ha già \`language\` nelle props:
\`\`\`typescript
interface MyComponentProps {
  // ... altre props
  language?: string;  // 👈 Aggiungi questa
}

export default function MyComponent({
  language = 'it',  // 👈 Default italiano
  ...otherProps
}: MyComponentProps) {
\`\`\`

---

## ❌ COSA NON FARE (IMPORTANTE):

- ❌ **🚨 NON RIMUOVERE "default" dall'export!** Deve essere \`export default function\` (CRITICO!)
- ❌ NON modificare stili CSS (Tailwind classes)
- ❌ NON modificare layout o struttura HTML
- ❌ NON modificare logica (funzioni, state, useEffect)
- ❌ NON modificare props esistenti (solo aggiungi language se manca)
- ❌ NON rimuovere import esistenti
- ❌ NON modificare chiamate a ReportEngine.formatValue()
- ❌ NON usare sistemi di traduzione esterni (useReportTranslations, getFilterLabel, etc.)
- ❌ NON aggiungere spiegazioni, note o commenti extra nella risposta
- ❌ **NON lasciare col.label, filter.label, group.label, config.title nel JSX!**

---

## ✅ LINGUE OBBLIGATORIE:

Traduci OGNI testo in TUTTE e 9 le lingue:
1. **it** = Italiano
2. **en** = English
3. **de** = Deutsch
4. **fr** = Français
5. **es** = Español
6. **pt** = Português
7. **hr** = Hrvatski (Croato)
8. **sl** = Slovenščina (Sloveno)
9. **el** = Ελληνικά (Greco)

---

## 🔍 VERIFICA FINALE OBBLIGATORIA (da fare PRIMA di restituire il codice):

**STOP! Prima di restituire il codice, esegui QUESTA CHECKLIST IN ORDINE:**

### ☑️ Step 0: Verifica EXPORT DEFAULT (CRITICO!)
Cerca nel codice la riga di export:
- ✅ Deve essere: \`export default function NomeComponente\`
- ❌ NON deve essere: \`export function NomeComponente\` (senza default)

**❌ Se manca "default" → FERMATI! Aggiungi "default" prima di continuare! Questo è CRITICO!**

### ☑️ Step 1: Verifica pattern da eliminare
Apri il tuo codice e cerca con CTRL+F (o CMD+F) questi pattern:
- \`col.label\`
- \`filter.label\`
- \`group.label\`
- \`config.title\`
- \`config.description\`

**❌ Se trovi ANCHE UNO SOLO di questi pattern → NON HAI FINITO! Devi sostituirli con TEXTS!**

### ☑️ Step 2: Verifica stringhe italiane hardcoded
Cerca nel JSX se ci sono ancora stringhe italiane tipo:
- "Quantità", "Valore", "Data", "Numero", "Totale"
- "Esporta", "Applica", "Reset", "Mostra"
- "Caricamento", "Nessun dato", "Errore"

**❌ Se trovi ANCHE UNA SOLA stringa italiana hardcoded → NON HAI FINITO!**

### ☑️ Step 3: Conta le traduzioni in TEXTS
1. Conta quante colonne ci sono nel componente (quante volte appare \`columns.map\`)
2. Conta quanti filtri ci sono (quante volte appare \`filters.map\`)
3. Conta quanti raggruppamenti ci sono (se presenti)
4. Verifica che in TEXTS ci siano:
   - \`columnXXX\` per OGNI colonna
   - \`filterXXX\` per OGNI filtro
   - \`groupXXX\` per OGNI raggruppamento

**Esempio:**
- Se ci sono 8 colonne → devi avere 8 voci \`column...\` in TEXTS
- Se ci sono 4 filtri → devi avere 4 voci \`filter...\` in TEXTS

**❌ Se mancano traduzioni → NON HAI FINITO!**

### ☑️ Step 4: Verifica le 9 lingue
Controlla 3-4 voci random in TEXTS e assicurati che abbiano TUTTE e 9 le lingue:
- it ✅
- en ✅
- de ✅
- fr ✅
- es ✅
- pt ✅
- hr ✅
- sl ✅
- el ✅

**❌ Se anche UNA SOLA voce manca di una lingua → NON HAI FINITO!**

### ☑️ Step 5: Se componenti multipli
Se hai ricevuto più componenti con separatori \`// ============\`:
1. Conta i componenti
2. Verifica di aver tradotto TUTTI (non solo il primo!)
3. Verifica che ogni componente abbia il suo TEXTS completo
4. Verifica che i separatori siano intatti
5. **Verifica che OGNI componente abbia "export default"!**

**❌ Se hai tradotto solo alcuni componenti → NON HAI FINITO!**

---

## ✅ SE HAI SUPERATO TUTTI I 6 STEP SOPRA (incluso Step 0!), ALLORA SEI PRONTO!

---

## 📤 OUTPUT:

Restituisci SOLO il codice completo del componente in un code block, senza spiegazioni:

\`\`\`typescript
[CODICE COMPLETO TRADOTTO QUI]
\`\`\`

Se hai ricevuto COMPONENTI MULTIPLI con separatori \`// ============\`, mantieni TUTTI i separatori e restituisci TUTTI i componenti tradotti.

---

## 📊 REPORT TITLES - Istruzioni speciali:

Se hai ricevuto un oggetto REPORT_TITLES con configurazioni report:
- Crea voci TEXTS per title e description di ogni report
- Sostituisci \`config.title\` con \`TEXTS.reportTitle[language]\`
- Sostituisci \`config.description\` con \`TEXTS.reportDescription[language]\`
- NON modificare report-config.json (quelle label restano in italiano)

---

## Codice del componente da tradurre:
`;

export default function ComponentCustomizer({ isOpen, onClose }: ComponentCustomizerProps) {
  const [selectedComponent, setSelectedComponent] = useState<string>('ReportTable');
  const [versions, setVersions] = useState<ComponentVersions | null>(null);
  const [currentCode, setCurrentCode] = useState('');
  const [modifiedCode, setModifiedCode] = useState('');
  const [versionNote, setVersionNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showVersions, setShowVersions] = useState(true);

  // Load versions when component changes
  useEffect(() => {
    if (selectedComponent) {
      loadVersions();
    }
  }, [selectedComponent]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/components/versions?component=${selectedComponent}`);
      const data = await response.json();
      setVersions(data);

      // Load current code
      const codeResponse = await fetch(`/api/components/write?component=${selectedComponent}`);
      const codeData = await codeResponse.json();
      if (codeData.success) {
        setCurrentCode(codeData.code);
        setModifiedCode('');
      }
    } catch (error) {
      console.error('Error loading versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyForAI = async () => {
    try {
      const fullText = AI_INSTRUCTIONS + '\n\n```typescript\n' + currentCode + '\n```';

      await navigator.clipboard.writeText(fullText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleCopyAllComponents = async () => {
    try {
      let fullText = AI_INSTRUCTIONS + '\n\n';

      // Carica tutti i componenti in ordine
      const componentsToLoad = ['ReportTable', 'ReportFilters', 'ReportExport', 'ReportBuilder'];

      for (let i = 0; i < componentsToLoad.length; i++) {
        const componentName = componentsToLoad[i];
        const componentInfo = ALLOWED_COMPONENTS.find(c => c.value === componentName);

        // Carica il codice del componente
        const response = await fetch(`/api/components/write?component=${componentName}`);
        const data = await response.json();

        if (data.success) {
          // Aggiungi separatore visibile
          fullText += `// ============================================================\n`;
          fullText += `// COMPONENTE: ${componentName}\n`;
          fullText += `// FILE: components/reports/${componentName}.tsx\n`;
          fullText += `// DESCRIZIONE: ${componentInfo?.description || ''}\n`;
          fullText += `// ============================================================\n\n`;
          fullText += data.code;

          // Aggiungi spazio tra componenti (tranne l'ultimo)
          if (i < componentsToLoad.length - 1) {
            fullText += '\n\n\n';
          }
        }
      }

      await navigator.clipboard.writeText(fullText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Error copying all components:', error);
      alert('❌ Errore nel caricamento dei componenti');
    }
  };

  const handleCopyForTranslation = async () => {
    try {
      const fullText = AI_TRANSLATION_INSTRUCTIONS + '\n\n```typescript\n' + currentCode + '\n```';

      await navigator.clipboard.writeText(fullText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleCopyAllForTranslation = async () => {
    try {
      let fullText = AI_TRANSLATION_INSTRUCTIONS + '\n\n';

      // 1. Carica configurazione report per includere titoli/descrizioni
      try {
        const reportResponse = await fetch('/api/reports/config');
        const reportData = await reportResponse.json();

        fullText += `// ============================================================\n`;
        fullText += `// CONTESTO: Titoli e descrizioni report da tradurre\n`;
        fullText += `// ============================================================\n\n`;
        fullText += `// I seguenti titoli e descrizioni devono essere tradotti nei componenti:\n`;
        fullText += `// - ReportBuilder.tsx: title, description\n`;
        fullText += `// - my-account/reports/page.tsx: title, description\n\n`;
        fullText += `const REPORT_TITLES = ${JSON.stringify(reportData, null, 2)};\n\n\n`;
      } catch (error) {
        console.warn('Could not load report config:', error);
      }

      // 2. Carica tutti i componenti in ordine
      const componentsToLoad = ['ReportTable', 'ReportFilters', 'ReportExport', 'ReportBuilder'];

      for (let i = 0; i < componentsToLoad.length; i++) {
        const componentName = componentsToLoad[i];
        const componentInfo = ALLOWED_COMPONENTS.find(c => c.value === componentName);

        // Carica il codice del componente
        const response = await fetch(`/api/components/write?component=${componentName}`);
        const data = await response.json();

        if (data.success) {
          // Aggiungi separatore visibile
          fullText += `// ============================================================\n`;
          fullText += `// COMPONENTE: ${componentName}\n`;
          fullText += `// FILE: components/reports/${componentName}.tsx\n`;
          fullText += `// DESCRIZIONE: ${componentInfo?.description || ''}\n`;
          fullText += `// ============================================================\n\n`;
          fullText += data.code;

          // Aggiungi spazio tra componenti (tranne l'ultimo)
          if (i < componentsToLoad.length - 1) {
            fullText += '\n\n\n';
          }
        }
      }

      await navigator.clipboard.writeText(fullText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Error copying all components:', error);
      alert('❌ Errore nel caricamento dei componenti');
    }
  };

  const parseMultipleComponents = (code: string): Array<{ name: string; code: string }> => {
    const components: Array<{ name: string; code: string }> = [];

    // Regex per trovare i separatori (con o senza DESCRIZIONE)
    // Formato 1: Con DESCRIZIONE
    // Formato 2: Senza DESCRIZIONE (generato da ChatGPT)
    const separatorRegex = /\/\/ ={60,}\n\/\/ COMPONENTE: (\w+)\n\/\/ FILE: [^\n]+\n(?:\/\/ DESCRIZIONE: [^\n]+\n)?\/\/ ={60,}\n/g;

    const matches = [...code.matchAll(separatorRegex)];

    if (matches.length === 0) {
      // Nessun separatore trovato, è un singolo componente
      return [];
    }

    // Estrai ogni componente
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const componentName = match[1];
      const startIndex = match.index! + match[0].length;
      const endIndex = i < matches.length - 1 ? matches[i + 1].index! : code.length;

      const componentCode = code.substring(startIndex, endIndex).trim();

      components.push({
        name: componentName,
        code: componentCode,
      });
    }

    return components;
  };

  interface ValidationIssue {
    type: 'missing_languages' | 'untranslated_label' | 'hardcoded_text';
    key?: string;
    missingLanguages?: string[];
    pattern?: string;
    line?: number;
  }

  const fixExportDefault = (code: string, componentName: string): { fixed: boolean; code: string; message?: string } => {
    // Verifica presenza di export default
    const hasExportDefault = /export\s+default\s+(function|class)\s+\w+/.test(code);

    if (hasExportDefault) {
      return { fixed: false, code }; // Già ok
    }

    // Cerca export function/class senza default
    const exportMatch = code.match(/^export\s+(function|class)\s+(\w+)/m);

    if (exportMatch) {
      // Auto-fix: aggiungi "default"
      const fixedCode = code.replace(
        /^export\s+(function|class)\s+(\w+)/m,
        'export default $1 $2'
      );

      return {
        fixed: true,
        code: fixedCode,
        message: `✅ Auto-corretto: Aggiunto "export default" in ${componentName}`
      };
    }

    // Nessun export trovato - errore critico
    return {
      fixed: false,
      code,
      message: `❌ ERRORE: ${componentName} non ha nessun export!\n\nAggiungi: export default function ${componentName}(...)`
    };
  };

  const validateTranslations = (code: string): { valid: boolean; issues: ValidationIssue[] } => {
    const issues: ValidationIssue[] = [];
    const REQUIRED_LANGUAGES = ['it', 'en', 'de', 'fr', 'es', 'pt', 'hr', 'sl', 'el'];

    // 1. Estrai oggetto TEXTS
    const textsMatch = code.match(/const\s+TEXTS\s*=\s*\{([\s\S]*?)\n\};/);

    if (textsMatch) {
      const textsContent = textsMatch[1];

      // Estrai ogni chiave TEXTS
      const keyRegex = /(\w+):\s*\{([^}]+)\}/g;
      let keyMatch;

      while ((keyMatch = keyRegex.exec(textsContent)) !== null) {
        const key = keyMatch[1];
        const translations = keyMatch[2];

        // Verifica che abbia tutte e 6 le lingue
        const foundLanguages = REQUIRED_LANGUAGES.filter(lang =>
          new RegExp(`${lang}:\\s*['"']`).test(translations)
        );

        if (foundLanguages.length < REQUIRED_LANGUAGES.length) {
          const missing = REQUIRED_LANGUAGES.filter(lang => !foundLanguages.includes(lang));
          issues.push({
            type: 'missing_languages',
            key,
            missingLanguages: missing,
          });
        }
      }
    }

    // 2. Cerca pattern non tradotti
    const untranslatedPatterns = [
      { pattern: /\bcol\.label\b/g, name: 'col.label' },
      { pattern: /\bfilter\.label\b/g, name: 'filter.label' },
      { pattern: /\bgroup\.label\b/g, name: 'group.label' },
    ];

    untranslatedPatterns.forEach(({ pattern, name }) => {
      const matches = code.match(pattern);
      if (matches && matches.length > 0) {
        issues.push({
          type: 'untranslated_label',
          pattern: name,
        });
      }
    });

    // 3. Cerca stringhe hardcoded italiane (DISABILITATO - troppi falsi positivi)
    // La regex matchava anche codice che usa correttamente TEXTS, generando falsi allarmi
    // Esempio falso positivo: <p>{TEXTS.noData[language]}</p>
    // Meglio fare controllo manuale o migliorare la regex in futuro

    return {
      valid: issues.length === 0,
      issues,
    };
  };

  const generateFixPrompt = (issues: ValidationIssue[]): string => {
    if (issues.length === 0) return '';

    let prompt = `# 🔧 CORREZIONE TRADUZIONI MANCANTI - ISTRUZIONI DETTAGLIATE\n\n`;
    prompt += `⚠️ **ATTENZIONE**: Il codice che hai fornito ha delle traduzioni incomplete!\n\n`;
    prompt += `Segui queste istruzioni PRECISE per completare le traduzioni.\n\n`;
    prompt += `---\n\n`;

    // Raggruppa per tipo
    const missingLangIssues = issues.filter(i => i.type === 'missing_languages');
    const untranslatedIssues = issues.filter(i => i.type === 'untranslated_label');
    const hardcodedIssues = issues.filter(i => i.type === 'hardcoded_text');

    // Problema 1: Lingue mancanti
    if (missingLangIssues.length > 0) {
      prompt += `## 🚨 PROBLEMA 1: Traduzioni incomplete nell'oggetto TEXTS\n\n`;
      prompt += `Ho trovato ${missingLangIssues.length} chiavi in TEXTS che NON hanno tutte e 6 le lingue.\n\n`;
      prompt += `**Chiavi con problemi:**\n\n`;
      missingLangIssues.forEach(issue => {
        prompt += `- \`${issue.key}\`: **Mancano** → ${issue.missingLanguages!.join(', ')}\n`;
      });
      prompt += `\n**❌ COSA STAI FACENDO MALE:**\n`;
      prompt += `Stai creando voci TEXTS che non hanno tutte e 6 le lingue richieste.\n\n`;
      prompt += `**✅ COME CORREGGERE:**\n`;
      prompt += `Per OGNI chiave sopra elencata, aggiungi le lingue mancanti.\n\n`;
      prompt += `**Esempio di correzione:**\n`;
      prompt += `\`\`\`typescript\n`;
      prompt += `// ❌ SBAGLIATO - mancano alcune lingue\n`;
      prompt += `${missingLangIssues[0].key}: {\n`;
      prompt += `  it: 'Valore italiano',\n`;
      prompt += `  en: 'English value'\n`;
      prompt += `  // Mancano de, fr, es, pt!\n`;
      prompt += `}\n\n`;
      prompt += `// ✅ CORRETTO - tutte e 6 le lingue\n`;
      prompt += `${missingLangIssues[0].key}: {\n`;
      prompt += `  it: 'Valore italiano',\n`;
      prompt += `  en: 'English value',\n`;
      prompt += `  de: 'Deutscher Wert',\n`;
      prompt += `  fr: 'Valeur française',\n`;
      prompt += `  es: 'Valor español',\n`;
      prompt += `  pt: 'Valor português'\n`;
      prompt += `}\n`;
      prompt += `\`\`\`\n\n`;
      prompt += `**LINGUE OBBLIGATORIE (SEMPRE TUTTE E 6):**\n`;
      prompt += `- it (Italiano)\n`;
      prompt += `- en (English)\n`;
      prompt += `- de (Deutsch)\n`;
      prompt += `- fr (Français)\n`;
      prompt += `- es (Español)\n`;
      prompt += `- pt (Português)\n\n`;
      prompt += `---\n\n`;
    }

    // Problema 2: Label non tradotte
    if (untranslatedIssues.length > 0) {
      prompt += `## 🚨 PROBLEMA 2: Label non tradotte trovate nel JSX\n\n`;
      prompt += `Ho trovato ${untranslatedIssues.length} pattern che usano label dal config invece di TEXTS.\n\n`;
      prompt += `**Pattern problematici trovati:**\n\n`;
      untranslatedIssues.forEach(issue => {
        prompt += `- \`${issue.pattern}\` → **DEVI SOSTITUIRE CON TEXTS!**\n`;
      });
      prompt += `\n**❌ COSA STAI FACENDO MALE:**\n`;
      prompt += `Stai usando direttamente \`col.label\`, \`filter.label\`, \`group.label\` o \`config.title\` nel JSX.\n`;
      prompt += `Questi valori sono in italiano e arrivano dal database/config.\n`;
      prompt += `NON puoi usarli direttamente perché non sono tradotti!\n\n`;
      prompt += `**✅ COME CORREGGERE:**\n\n`;
      prompt += `**Step 1**: Per OGNI pattern trovato, identifica il campo (es: "data_ordine", "quantita", "valore")\n\n`;
      prompt += `**Step 2**: Crea una voce in TEXTS con quel campo:\n`;
      prompt += `\`\`\`typescript\n`;
      prompt += `const TEXTS = {\n`;
      prompt += `  // Se il pattern è col.label e col.field = "quantita"\n`;
      prompt += `  columnQuantita: {\n`;
      prompt += `    it: 'Quantità',\n`;
      prompt += `    en: 'Quantity',\n`;
      prompt += `    de: 'Menge',\n`;
      prompt += `    fr: 'Quantité',\n`;
      prompt += `    es: 'Cantidad',\n`;
      prompt += `    pt: 'Quantidade'\n`;
      prompt += `  },\n`;
      prompt += `  // Se il pattern è filter.label e filter.field = "data_ordine"\n`;
      prompt += `  filterDataOrdine: {\n`;
      prompt += `    it: 'Data Ordine',\n`;
      prompt += `    en: 'Order Date',\n`;
      prompt += `    de: 'Bestelldatum',\n`;
      prompt += `    fr: 'Date de Commande',\n`;
      prompt += `    es: 'Fecha de Pedido',\n`;
      prompt += `    pt: 'Data do Pedido'\n`;
      prompt += `  },\n`;
      prompt += `  // ... etc per OGNI campo\n`;
      prompt += `};\n`;
      prompt += `\`\`\`\n\n`;
      prompt += `**Step 3**: Sostituisci nel JSX con mapping dinamico:\n`;
      prompt += `\`\`\`typescript\n`;
      prompt += `// ❌ SBAGLIATO - usa col.label direttamente\n`;
      prompt += `{columns.map((col) => <th>{col.label}</th>)}\n\n`;
      prompt += `// ✅ CORRETTO - mapping a TEXTS\n`;
      prompt += `{columns.map((col) => {\n`;
      prompt += `  const labelKey = 'column' + col.field.charAt(0).toUpperCase() + col.field.slice(1);\n`;
      prompt += `  return <th>{TEXTS[labelKey]?.[language] || col.field}</th>;\n`;
      prompt += `})}\n`;
      prompt += `\`\`\`\n\n`;
      prompt += `**IMPORTANTE**: Devi fare questo per:\n`;
      prompt += `- ✅ TUTTE le colonne (ogni \`col.label\` → \`TEXTS.column...\`)\n`;
      prompt += `- ✅ TUTTI i filtri (ogni \`filter.label\` → \`TEXTS.filter...\`)\n`;
      prompt += `- ✅ TUTTI i raggruppamenti (ogni \`group.label\` → \`TEXTS.group...\`)\n`;
      prompt += `- ✅ Titoli report (\`config.title\` → \`TEXTS.reportTitle\`)\n\n`;
      prompt += `---\n\n`;
    }

    // Problema 3: Testi hardcoded
    if (hardcodedIssues.length > 0) {
      prompt += `## 🚨 PROBLEMA 3: Testi italiani hardcoded nel JSX\n\n`;
      prompt += `Ho trovato testi italiani scritti direttamente nel codice JSX.\n\n`;
      prompt += `**Esempio trovato:**\n`;
      prompt += `\`\`\`typescript\n`;
      prompt += `${hardcodedIssues[0].pattern}\n`;
      prompt += `\`\`\`\n\n`;
      prompt += `**❌ COSA STAI FACENDO MALE:**\n`;
      prompt += `Stai scrivendo testi italiani direttamente nel JSX come stringhe hardcoded.\n`;
      prompt += `Questi testi NON verranno tradotti quando l'utente cambia lingua!\n\n`;
      prompt += `**✅ COME CORREGGERE:**\n\n`;
      prompt += `**Step 1**: Cerca TUTTE le stringhe italiane nel JSX (non solo quella sopra!):\n`;
      prompt += `- Bottoni: "Esporta", "Applica filtri", "Reset", "Salva", etc.\n`;
      prompt += `- Messaggi: "Caricamento...", "Nessun dato", "Errore", etc.\n`;
      prompt += `- Labels: "Quantità", "Valore", "Data", "Numero", etc.\n`;
      prompt += `- Placeholder: "Cerca...", "Seleziona...", "Tutti", etc.\n\n`;
      prompt += `**Step 2**: Per OGNI stringa, crea una voce in TEXTS:\n`;
      prompt += `\`\`\`typescript\n`;
      prompt += `const TEXTS = {\n`;
      prompt += `  buttonExport: {\n`;
      prompt += `    it: 'Esporta',\n`;
      prompt += `    en: 'Export',\n`;
      prompt += `    de: 'Exportieren',\n`;
      prompt += `    fr: 'Exporter',\n`;
      prompt += `    es: 'Exportar',\n`;
      prompt += `    pt: 'Exportar'\n`;
      prompt += `  },\n`;
      prompt += `  messageLoading: {\n`;
      prompt += `    it: 'Caricamento dati...',\n`;
      prompt += `    en: 'Loading data...',\n`;
      prompt += `    de: 'Daten werden geladen...',\n`;
      prompt += `    fr: 'Chargement des données...',\n`;
      prompt += `    es: 'Cargando datos...',\n`;
      prompt += `    pt: 'Carregando dados...'\n`;
      prompt += `  },\n`;
      prompt += `  // ... etc\n`;
      prompt += `};\n`;
      prompt += `\`\`\`\n\n`;
      prompt += `**Step 3**: Sostituisci nel JSX:\n`;
      prompt += `\`\`\`typescript\n`;
      prompt += `// ❌ SBAGLIATO\n`;
      prompt += `<button>Esporta</button>\n`;
      prompt += `<span>Caricamento dati...</span>\n\n`;
      prompt += `// ✅ CORRETTO\n`;
      prompt += `<button>{TEXTS.buttonExport[language]}</button>\n`;
      prompt += `<span>{TEXTS.messageLoading[language]}</span>\n`;
      prompt += `\`\`\`\n\n`;
      prompt += `---\n\n`;
    }

    // Riepilogo azioni
    prompt += `## ✅ RIEPILOGO: COSA DEVI FARE ESATTAMENTE\n\n`;
    prompt += `Segui QUESTI STEP IN ORDINE:\n\n`;

    let stepNumber = 1;

    if (missingLangIssues.length > 0) {
      prompt += `**${stepNumber}. Completa le lingue mancanti in TEXTS:**\n`;
      prompt += `   - Per ogni chiave elencata sopra, aggiungi le lingue mancanti\n`;
      prompt += `   - Ogni chiave DEVE avere tutte e 6 le lingue: it, en, de, fr, es, pt\n\n`;
      stepNumber++;
    }

    if (untranslatedIssues.length > 0) {
      prompt += `**${stepNumber}. Sostituisci i pattern non tradotti:**\n`;
      prompt += `   - Crea voci TEXTS per ogni colonna/filtro/raggruppamento\n`;
      prompt += `   - Sostituisci TUTTI i \`col.label\`, \`filter.label\`, etc. con mapping dinamico a TEXTS\n`;
      prompt += `   - Non lasciare NESSUN pattern non tradotto!\n\n`;
      stepNumber++;
    }

    if (hardcodedIssues.length > 0) {
      prompt += `**${stepNumber}. Elimina i testi hardcoded:**\n`;
      prompt += `   - Cerca TUTTE le stringhe italiane nel JSX\n`;
      prompt += `   - Crea voci TEXTS per ognuna\n`;
      prompt += `   - Sostituiscile con \`TEXTS.qualcosa[language]\`\n\n`;
      stepNumber++;
    }

    prompt += `**${stepNumber}. Verifica finale:**\n`;
    prompt += `   - Usa CTRL+F (o CMD+F) per cercare: \`col.label\`, \`filter.label\`, \`group.label\`, \`config.title\`\n`;
    prompt += `   - Se ne trovi ancora, NON hai finito!\n`;
    prompt += `   - Cerca stringhe italiane hardcoded tipo: "Quantità", "Esporta", "Caricamento"\n`;
    prompt += `   - Se ne trovi ancora, NON hai finito!\n\n`;

    prompt += `**${stepNumber + 1}. Restituisci il codice:**\n`;
    prompt += `   - SOLO il codice completo corretto\n`;
    prompt += `   - In un code block TypeScript\n`;
    prompt += `   - SENZA spiegazioni o commenti extra\n\n`;

    prompt += `---\n\n`;
    prompt += `## 📤 OUTPUT RICHIESTO\n\n`;
    prompt += `Restituisci SOLO il codice completo in questo formato:\n\n`;
    prompt += `\`\`\`typescript\n`;
    prompt += `[CODICE COMPLETO CORRETTO QUI]\n`;
    prompt += `\`\`\`\n\n`;
    prompt += `---\n\n`;
    prompt += `## 📄 Codice da correggere:\n\n`;

    return prompt;
  };

  const handleSave = async () => {
    if (!modifiedCode.trim()) {
      alert('Incolla il codice modificato prima di salvare');
      return;
    }

    try {
      setSaving(true);

      // Verifica se ci sono componenti multipli
      const multipleComponents = parseMultipleComponents(modifiedCode);

      // VALIDAZIONE 1: Export default (AUTO-FIX)
      const componentsToCheck = multipleComponents.length > 0
        ? multipleComponents
        : [{ name: selectedComponent, code: modifiedCode }];

      let autoFixMessages: string[] = [];
      let hasError = false;

      // Auto-fix export default per ogni componente
      for (let i = 0; i < componentsToCheck.length; i++) {
        const comp = componentsToCheck[i];
        const result = fixExportDefault(comp.code, comp.name);

        if (result.fixed) {
          // Applica la correzione
          componentsToCheck[i].code = result.code;
          autoFixMessages.push(result.message!);
        } else if (result.message) {
          // Errore critico (nessun export trovato)
          alert(result.message);
          setSaving(false);
          hasError = true;
          break;
        }
      }

      if (hasError) return;

      // Se ci sono state auto-correzioni, aggiorna il codice e mostra alert
      if (autoFixMessages.length > 0) {
        // Ricostruisci il codice con le correzioni
        if (multipleComponents.length > 0) {
          let fixedCode = '';
          componentsToCheck.forEach((comp, index) => {
            if (index > 0) fixedCode += '\n\n';
            fixedCode += `// ============================================================\n`;
            fixedCode += `// COMPONENTE: ${comp.name}\n`;
            fixedCode += `// FILE: components/reports/${comp.name}.tsx\n`;
            fixedCode += `// ============================================================\n\n`;
            fixedCode += comp.code;
          });
          setModifiedCode(fixedCode);
        } else {
          setModifiedCode(componentsToCheck[0].code);
        }

        alert(
          `🔧 AUTO-CORREZIONE APPLICATA:\n\n` +
          autoFixMessages.join('\n') +
          `\n\nIl codice è stato corretto automaticamente.\n` +
          `Puoi vedere le modifiche nella textarea.\n\n` +
          `Clicca di nuovo "Salva componenti" per salvare il codice corretto.`
        );

        setSaving(false);
        return;
      }

      // Aggiorna multipleComponents con il codice eventualmente corretto
      if (multipleComponents.length > 0) {
        multipleComponents.splice(0, multipleComponents.length, ...componentsToCheck);
      }

      // VALIDAZIONE 2: Traduzioni (warning - permette salvataggio)
      const componentsToValidate = multipleComponents.length > 0
        ? multipleComponents.map(c => c.code)
        : [modifiedCode];

      let allIssues: { component: string; issues: ValidationIssue[] }[] = [];

      componentsToValidate.forEach((code, index) => {
        const componentName = multipleComponents.length > 0
          ? multipleComponents[index].name
          : selectedComponent;

        const validation = validateTranslations(code);

        if (!validation.valid) {
          allIssues.push({
            component: componentName,
            issues: validation.issues,
          });
        }
      });

      // Se ci sono problemi, gestisci in modo intelligente
      if (allIssues.length > 0) {
        const totalIssues = allIssues.reduce((sum, c) => sum + c.issues.length, 0);
        const hasMultipleComponents = multipleComponents.length > 0;
        const validComponents = hasMultipleComponents
          ? multipleComponents.filter(comp => !allIssues.find(issue => issue.component === comp.name))
          : [];

        let message = `⚠️ ATTENZIONE: Rilevati ${totalIssues} problemi di traduzione in ${allIssues.length} componente/i.\n\n`;
        message += allIssues.map(c => `${c.component}: ${c.issues.length} problemi`).join('\n');

        if (hasMultipleComponents && validComponents.length > 0) {
          message += `\n\n✅ ${validComponents.length} componente/i sono OK:\n`;
          message += validComponents.map(c => `✓ ${c.name}`).join('\n');
          message += `\n\nVuoi:\n`;
          message += `- OK = Salva componenti OK + genera prompt per correggere quelli con problemi\n`;
          message += `- Annulla = Salva TUTTO comunque (sconsigliato)`;
        } else {
          message += `\n\nVuoi:\n`;
          message += `- OK = Genera prompt per correggere con AI\n`;
          message += `- Annulla = Salva comunque (sconsigliato)`;
        }

        const proceed = confirm(message);

        if (proceed) {
          // Se ci sono componenti multipli, salva prima quelli validi
          if (hasMultipleComponents && validComponents.length > 0) {
            let savedCount = 0;
            const saveErrors: string[] = [];

            for (const comp of validComponents) {
              try {
                // Save as new version
                const versionResponse = await fetch('/api/components/versions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    component: comp.name,
                    note: versionNote || `Modifica multipla ${new Date().toLocaleString('it-IT')}`,
                    code: comp.code,
                  }),
                });

                if (!versionResponse.ok) {
                  throw new Error(`Failed to save version for ${comp.name}`);
                }

                // Write to file
                const writeResponse = await fetch('/api/components/write', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    component: comp.name,
                    code: comp.code,
                  }),
                });

                if (!writeResponse.ok) {
                  const errorData = await writeResponse.json();
                  throw new Error(errorData.error || `Failed to write ${comp.name}`);
                }

                savedCount++;
              } catch (error: any) {
                console.error(`Error saving ${comp.name}:`, error);
                saveErrors.push(`${comp.name}: ${error.message}`);
              }
            }

            if (saveErrors.length > 0) {
              alert(`⚠️ Alcuni componenti OK non sono stati salvati:\n${saveErrors.join('\n')}`);
            }
          }

          // Genera prompt di correzione SOLO per componenti con problemi
          let fixPrompt = `# 🔧 CORREZIONI NECESSARIE\n\n`;

          if (hasMultipleComponents && validComponents.length > 0) {
            fixPrompt += `✅ **${validComponents.length} componente/i già salvati:**\n`;
            fixPrompt += validComponents.map(c => `- ${c.name}`).join('\n');
            fixPrompt += `\n\n❌ **Devi correggere questi componenti:**\n`;
            fixPrompt += allIssues.map(c => `- ${c.component}`).join('\n');
            fixPrompt += `\n\n---\n\n`;
          }

          allIssues.forEach(({ component, issues }) => {
            fixPrompt += `## Componente: ${component}\n\n`;
            fixPrompt += generateFixPrompt(issues);
            fixPrompt += `\n---\n\n`;
          });

          // Include SOLO i componenti con problemi nel codice
          const problematicComponents = multipleComponents.length > 0
            ? multipleComponents.filter(comp => allIssues.find(issue => issue.component === comp.name))
            : [];

          if (problematicComponents.length > 0) {
            // Ricostruisci il codice con separatori solo per componenti problematici
            let problematicCode = '';
            problematicComponents.forEach((comp, index) => {
              if (index > 0) problematicCode += '\n\n';
              problematicCode += `// ============================================================\n`;
              problematicCode += `// COMPONENTE: ${comp.name}\n`;
              problematicCode += `// FILE: components/reports/${comp.name}.tsx\n`;
              problematicCode += `// ============================================================\n\n`;
              problematicCode += comp.code;
            });
            fixPrompt += `## 📄 Codice da correggere:\n\n\`\`\`typescript\n${problematicCode}\n\`\`\``;
          } else {
            // Componente singolo
            fixPrompt += `## 📄 Codice da correggere:\n\n\`\`\`typescript\n${modifiedCode}\n\`\`\``;
          }

          // Copia negli appunti
          await navigator.clipboard.writeText(fixPrompt);

          // Sostituisci la textarea con SOLO i componenti problematici
          if (problematicComponents.length > 0) {
            // Ricostruisci il codice con separatori solo per componenti problematici
            let problematicCode = '';
            problematicComponents.forEach((comp, index) => {
              if (index > 0) problematicCode += '\n\n';
              problematicCode += `// ============================================================\n`;
              problematicCode += `// COMPONENTE: ${comp.name}\n`;
              problematicCode += `// FILE: components/reports/${comp.name}.tsx\n`;
              problematicCode += `// ============================================================\n\n`;
              problematicCode += comp.code;
            });
            setModifiedCode(problematicCode);
          }
          // Se è componente singolo, lascia il codice com'è

          let alertMessage = '';
          if (hasMultipleComponents && validComponents.length > 0) {
            alertMessage = `✅ Salvati ${validComponents.length} componente/i OK!\n\n`;
            alertMessage += `📋 Prompt di correzione copiato negli appunti.\n\n`;
            alertMessage += `✨ La textarea ora contiene SOLO ${allIssues.length} componente/i da correggere.\n\n`;
            alertMessage += `PROSSIMI PASSI:\n`;
            alertMessage += `1. Incolla il prompt in ChatGPT/Claude\n`;
            alertMessage += `2. Ottieni il codice corretto\n`;
            alertMessage += `3. Torna qui e SOSTITUISCI il contenuto della textarea con il codice corretto\n`;
            alertMessage += `4. Clicca di nuovo "Salva componenti"`;
          } else {
            alertMessage = `✅ Prompt di correzione copiato negli appunti!\n\n`;
            alertMessage += `Incollalo in ChatGPT/Claude per ottenere il codice corretto.\n\n`;
            alertMessage += `Poi torna qui, SOSTITUISCI il contenuto della textarea e clicca "Salva componenti".`;
          }

          alert(alertMessage);

          setSaving(false);
          return;
        }
        // else: procedi con salvataggio nonostante i problemi
      }

      if (multipleComponents.length > 0) {
        // Salvataggio multiplo
        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        for (const comp of multipleComponents) {
          try {
            // Save as new version
            const versionResponse = await fetch('/api/components/versions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                component: comp.name,
                note: versionNote || `Modifica multipla ${new Date().toLocaleString('it-IT')}`,
                code: comp.code,
              }),
            });

            if (!versionResponse.ok) {
              throw new Error(`Failed to save version for ${comp.name}`);
            }

            // Write to file
            const writeResponse = await fetch('/api/components/write', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                component: comp.name,
                code: comp.code,
              }),
            });

            if (!writeResponse.ok) {
              const errorData = await writeResponse.json();
              throw new Error(errorData.error || `Failed to write ${comp.name}`);
            }

            successCount++;
          } catch (error: any) {
            console.error(`Error saving ${comp.name}:`, error);
            errorCount++;
            errors.push(`${comp.name}: ${error.message}`);
          }
        }

        // Mostra risultati
        if (errorCount === 0) {
          alert(`✅ Tutti i ${successCount} componenti salvati con successo!\n\n` +
                multipleComponents.map(c => `✓ ${c.name}`).join('\n'));
        } else {
          alert(`⚠️ Salvati ${successCount}/${multipleComponents.length} componenti\n\n` +
                `Errori:\n${errors.join('\n')}`);
        }

        // Chiudi il modal e ricarica
        setModifiedCode('');
        setVersionNote('');

        setTimeout(() => {
          onClose();
        }, 1000);

      } else {
        // Salvataggio singolo (comportamento originale)
        const versionResponse = await fetch('/api/components/versions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            component: selectedComponent,
            note: versionNote || `Modifica ${new Date().toLocaleString('it-IT')}`,
            code: modifiedCode,
          }),
        });

        if (!versionResponse.ok) {
          throw new Error('Failed to save version');
        }

        // Write to file
        const writeResponse = await fetch('/api/components/write', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            component: selectedComponent,
            code: modifiedCode,
          }),
        });

        if (!writeResponse.ok) {
          const errorData = await writeResponse.json();
          throw new Error(errorData.error || 'Failed to write component');
        }

        // Chiudi il modal automaticamente dopo il salvataggio
        setModifiedCode('');
        setVersionNote('');

        // Mostra messaggio di successo breve
        alert('✅ Componente salvato! Chiusura in corso...');

        // Chiudi il modal dopo un breve delay per permettere al messaggio di essere visto
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } catch (error: any) {
      console.error('Error saving component:', error);

      // Proponi auto-fix con Claude
      const userWantsAutoFix = confirm(
        `❌ Errore nel salvataggio: ${error.message}\n\n` +
        `Vuoi che Claude AI provi a sistemare automaticamente il codice?\n\n` +
        `- OK = Claude analizza e corregge il codice automaticamente\n` +
        `- Annulla = Chiudi e correggi manualmente`
      );

      if (userWantsAutoFix) {
        try {
          setSaving(true);

          // Determina quale codice inviare
          const multipleComponents = parseMultipleComponents(modifiedCode);
          const codeToFix = multipleComponents.length > 0
            ? modifiedCode // Invia tutto se ci sono più componenti
            : modifiedCode;

          const componentToFix = multipleComponents.length > 0
            ? 'MultiComponent'
            : selectedComponent;

          // Chiama API autofix
          const autofixResponse = await fetch('/api/components/autofix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: codeToFix,
              componentName: componentToFix,
              errorMessage: error.message,
            }),
          });

          if (!autofixResponse.ok) {
            throw new Error('Auto-fix failed');
          }

          const autofixData = await autofixResponse.json();

          if (autofixData.success && autofixData.code) {
            // Aggiorna la textarea con il codice corretto
            setModifiedCode(autofixData.code);

            alert(
              `✅ Claude ha corretto il codice automaticamente!\n\n` +
              `Il codice corretto è stato inserito nella textarea.\n\n` +
              `Verifica che sia corretto e clicca di nuovo "Salva componenti".`
            );
          } else {
            throw new Error(autofixData.error || 'Auto-fix failed');
          }
        } catch (autofixError: any) {
          console.error('Auto-fix error:', autofixError);
          alert(`❌ Auto-fix non riuscito: ${autofixError.message}\n\nCorreggi manualmente il codice.`);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLoadVersion = async (versionId: string) => {
    const version = versions?.versions.find(v => v.id === versionId);
    if (version) {
      setModifiedCode(version.code);
    }
  };

  const handleSetActiveVersion = async (versionId: string) => {
    try {
      const response = await fetch('/api/components/versions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          component: selectedComponent,
          versionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to set active version');
      }

      // Write to file
      const version = versions?.versions.find(v => v.id === versionId);
      if (version) {
        const writeResponse = await fetch('/api/components/write', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            component: selectedComponent,
            code: version.code,
          }),
        });

        if (!writeResponse.ok) {
          throw new Error('Failed to write component');
        }

        alert('✅ Versione attivata con successo!');
        loadVersions();
      }
    } catch (error) {
      console.error('Error setting active version:', error);
      alert('❌ Errore nell\'attivazione della versione');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🎨 Personalizzazione UI Componenti</h2>
            <p className="text-sm text-gray-600 mt-1">
              Modifica l'aspetto grafico dei componenti con l'aiuto di AI
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Component Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleziona Componente
            </label>
            <select
              value={selectedComponent}
              onChange={(e) => setSelectedComponent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ALLOWED_COMPONENTS.map((comp) => (
                <option key={comp.value} value={comp.value}>
                  {comp.label} - {comp.description}
                </option>
              ))}
            </select>
          </div>

          {/* Versions History */}
          {versions && versions.versions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Versioni Salvate ({versions.versions.length}/5)
                </h3>
                <button
                  onClick={() => setShowVersions(!showVersions)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showVersions ? 'Nascondi' : 'Mostra'}
                </button>
              </div>

              {showVersions && (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {versions.versions.map((version) => (
                    <div
                      key={version.id}
                      className={`flex items-center justify-between p-3 border rounded-md ${
                        version.id === versions.active
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{version.id}</span>
                          {version.id === versions.active && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              Attiva
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 truncate" title={version.note}>
                          {version.note}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(version.timestamp).toLocaleString('it-IT')}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-3">
                        <button
                          onClick={() => handleLoadVersion(version.id)}
                          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200 whitespace-nowrap"
                        >
                          Carica
                        </button>
                        {version.id !== versions.active && (
                          <button
                            onClick={() => handleSetActiveVersion(version.id)}
                            className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-md border border-green-200 whitespace-nowrap"
                          >
                            Attiva
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Copy for AI */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                Step 1: Copia per AI
              </h3>
            </div>

            {/* Bottoni Personalizzazione Generale */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-blue-900">🎨 Personalizzazione Generale</h4>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyForAI}
                    disabled={!currentCode}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      copySuccess
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {copySuccess ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Copiato!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Singolo
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCopyAllComponents}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      copySuccess
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {copySuccess ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Copiato!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Tutti e 4
                      </>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-xs text-blue-700">
                Per modifiche grafiche, stili, layout, animazioni, etc.
              </p>
            </div>

            {/* Bottoni Solo Traduzione */}
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-teal-900">🌍 Solo Traduzione (Consigliato)</h4>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyForTranslation}
                    disabled={!currentCode}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      copySuccess
                        ? 'bg-green-600 text-white'
                        : 'bg-teal-600 text-white hover:bg-teal-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {copySuccess ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Copiato!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Singolo
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCopyAllForTranslation}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      copySuccess
                        ? 'bg-green-600 text-white'
                        : 'bg-teal-600 text-white hover:bg-teal-700'
                    }`}
                  >
                    {copySuccess ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Copiato!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Tutti e 4
                      </>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-xs text-teal-700">
                ✨ Istruzioni specifiche per tradurre SOLO i testi senza modificare altro. Più preciso e affidabile!
              </p>
            </div>

            <div className="bg-white border border-gray-300 rounded p-3 text-xs font-mono overflow-x-auto max-h-40 overflow-y-auto mt-3">
              {currentCode ? (
                <pre className="text-gray-600">{currentCode.substring(0, 500)}...</pre>
              ) : (
                <p className="text-gray-400">Caricamento codice...</p>
              )}
            </div>
          </div>

          {/* Paste Modified Code */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                Step 2: Incolla Codice Modificato da AI
              </h3>
              {modifiedCode && parseMultipleComponents(modifiedCode).length > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                  ✨ {parseMultipleComponents(modifiedCode).length} componenti rilevati
                </span>
              )}
            </div>
            <textarea
              value={modifiedCode}
              onChange={(e) => setModifiedCode(e.target.value)}
              placeholder="Incolla qui il codice modificato dall'AI..."
              className="w-full h-64 px-4 py-3 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {modifiedCode && parseMultipleComponents(modifiedCode).length > 0 && (
              <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-md">
                <p className="text-xs text-purple-900 font-medium mb-1">
                  🎯 Salvataggio automatico multiplo attivo
                </p>
                <p className="text-xs text-purple-700">
                  I seguenti componenti verranno salvati automaticamente:
                </p>
                <ul className="mt-2 space-y-1">
                  {parseMultipleComponents(modifiedCode).map((comp) => (
                    <li key={comp.name} className="text-xs text-purple-800 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                      {comp.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Version Note */}
          {modifiedCode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nota Versione (opzionale)
              </label>
              <input
                type="text"
                value={versionNote}
                onChange={(e) => setVersionNote(e.target.value)}
                placeholder="es. Tabella con colori più chiari"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            💡 Le modifiche verranno applicate automaticamente tramite hot reload
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 font-medium"
            >
              Chiudi
            </button>
            <button
              onClick={handleSave}
              disabled={!modifiedCode.trim() || saving}
              className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salva e Applica
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
