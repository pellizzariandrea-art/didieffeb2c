# Note Sessione - Ottimizzazione Wizard E-commerce

**Data:** 22 Ottobre 2025
**Commit:** `4fe2334` - "Optimize wizard for mobile and fix filter translations"

## 🎯 Obiettivi Raggiunti

### 1. Fix Configurazione Wizard
- ✅ **Problema:** Configurazione wizard non si sincronizzava correttamente con l'admin online
- ✅ **Soluzione:** Creato API route Next.js proxy per evitare CORS
  - File: `frontend/app/admin/api/get-wizard-config/route.ts`
  - Proxy verso: `https://shop.didieffeb2b.com/admin/api/get-wizard-config.php`

### 2. Fix Filtri Booleani (Applicazione su...)
- ✅ **Problema:** Step "caratteristiche" non riconosceva filtri booleani (mostrava 0 filtri)
- ✅ **Causa:** Filtri avevano valori `['0', '1']` invece di solo `['1']`
- ✅ **Soluzione:** Modificato `characteristicsFilters` in `WizardSearch.tsx:305-332`
  ```typescript
  // Ora accetta filtri con valori '0' e '1' (non solo '1')
  const onlyBooleanValues = f.availableValues.every(v => v === '0' || v === '1');
  ```

### 3. Fix IncludeFilters per Caratteristiche
- ✅ **Problema:** Step caratteristiche non rispettava `includeFilters` configuration
- ✅ **Soluzione:** Modificato `wizard-builder.php:674` per salvare `includeFilters`
  ```javascript
  // Aggiunge includeFilters ai filtri booleani abilitati
  step.includeFilters = enabledFilters;
  ```

### 4. Ottimizzazione Mobile
- ✅ **Modal:** Altezza aumentata (95vh mobile vs 90vh desktop)
- ✅ **Header:** Padding ridotto (`px-4 py-3` mobile vs `px-6 py-4` desktop)
- ✅ **Progress bar:** Info stacked verticalmente su mobile
- ✅ **Titoli:** `text-lg` mobile vs `text-xl` desktop
- ✅ **Bottoni:** Touch-friendly con `touch-manipulation`
- ✅ **Checkbox:** Dimensioni ridotte (`w-5 h-5` mobile vs `w-6 h-6` desktop)

### 5. Riposizionamento Bottone Wizard
**Mobile:**
- ❌ ~~Bottone fluttuante (copriva prodotti)~~
- ✅ Bottone sotto barra di ricerca
- ✅ Bottone in alto nel pannello filtri mobile

**Desktop:**
- ✅ Bottone fluttuante in basso a destra (`bottom-8 right-8`)

### 6. Fix Traduzioni Valori Filtri
- ✅ **Problema:** Filtri mostravano valori raw invece di traduzioni
- ✅ **Soluzione:** Usata stessa logica di `FilterSidebar.tsx:46-114`
  ```typescript
  // opt.value è un oggetto {it: 'Borchie', en: 'Studs', ...}
  const getTranslatedValue = (val, lang) => {
    if (typeof val === 'object') return val[lang] || val['it'];
    return val;
  };
  ```

## 📁 File Modificati

### Frontend (Git/Vercel)
- ✅ `frontend/components/WizardSearch.tsx` - Logica wizard, ottimizzazione mobile, traduzioni
- ✅ `frontend/components/ProductCatalog.tsx` - Riposizionamento bottone wizard
- ✅ `frontend/app/admin/api/get-wizard-config/route.ts` - Nuovo: API proxy per CORS

### Backend (FTP - Da caricare manualmente)
- ⚠️ `admin/pages/wizard-builder.php:674` - Salvataggio includeFilters
- ⚠️ `admin/data/wizard-config.json` - Configurazione aggiornata con includeFilters

## 🔧 Architettura Tecnica

### Deployment
- **Frontend:** Git → Vercel (automatico)
- **Backend PHP:** FTP manuale su `shop.didieffeb2b.com`

### Configurazione Wizard
```
Browser (localhost/Vercel)
    ↓
Next.js API Route: /admin/api/get-wizard-config
    ↓
Proxy fetch → https://shop.didieffeb2b.com/admin/api/get-wizard-config.php
    ↓
Returns: wizard-config.json
```

### Step Wizard
1. **Welcome** - Schermata iniziale
2. **Characteristics** (skip category) - Filtri booleani (Applicazione su...)
3. **Filter: Tipologia** - Multi-select
4. **Filter: Materiale** - Multi-select
5. **Filter: Colore** - Optional multi-select
6. **Results** - Preview prodotti

## 🐛 Problemi Risolti

### 1. CORS Error
```
❌ TypeError: Failed to fetch
   at WizardSearch.useEffect.loadConfig
```
**Fix:** Next.js API route proxy (server-side fetch, no CORS)

### 2. Filtri Booleani Non Riconosciuti
```
[DEBUG] characteristics booleanFilters: Array(0)
```
**Fix:** Accettare filtri con `['0', '1']` non solo `['1']`

### 3. IncludeFilters Undefined
```
[DEBUG] Step 2 includeFilters: undefined
```
**Fix:** Modificato wizard-builder.php per salvare includeFilters

### 4. Traduzioni Non Funzionanti
```
Mostrava: "Borchie", "Coprinterruttori" (sempre italiano)
```
**Fix:** Usare `getTranslatedValue` come FilterSidebar

### 5. Bottone Wizard Copriva Prodotti
```
Mobile: fixed bottom-32 left-4 (copriva grid prodotti)
```
**Fix:** Integrato in search/filters mobile, fluttuante solo desktop

## 📝 TODO Futuri

- [ ] Rimuovere console.log di debug da WizardSearch.tsx (se non più necessari)
- [ ] Testare wizard con cambio lingua (EN, DE, FR, ES, PT)
- [ ] Verificare comportamento wizard quando 0 prodotti trovati
- [ ] Ottimizzare performance caricamento wizard (lazy load?)
- [ ] Aggiungere analytics per tracciare uso wizard

## 💡 Note Tecniche Importanti

### Filtri Booleani
I filtri "Applicazione su Legno", "Applicazione su Allumino", "Applicazione su Pvc" hanno:
- `availableValues: ['0', '1']` (non solo `['1']`)
- Devono essere riconosciuti come booleani
- Il valore selezionato è sempre `'1'` (true)

### Traduzioni Filtri
Le opzioni dei filtri hanno questa struttura:
```typescript
{
  value: { it: 'Borchie', en: 'Studs', de: 'Nieten', ... },
  label: { it: 'Borchie', en: 'Studs', de: 'Nieten', ... }
}
```

Per trovare la traduzione:
1. Confronta `getTranslatedValue(opt.value, 'it')` con il valore del prodotto
2. Restituisci `getTranslatedValue(opt.value, currentLang)`

### Step Configuration
Lo step "category" è deprecato e viene automaticamente filtrato:
```typescript
steps: data.config.steps.filter(step => step.type !== 'category')
```

## 🚀 Deploy Status

**Git Commit:** `4fe2334`
**Branch:** `main`
**Vercel:** Auto-deploy attivato
**FTP:** Wizard-builder.php e wizard-config.json da caricare manualmente

---

*Documento generato automaticamente da Claude Code*
*Ultima modifica: 22 Ottobre 2025*
