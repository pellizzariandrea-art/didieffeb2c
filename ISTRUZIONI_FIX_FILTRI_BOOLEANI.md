# Fix Filtri Booleani - Procedura

## 🐛 Problema
I filtri booleani mostrano "Sì/No" invece di checkbox perché il `products.json` online è vecchio.

## ✅ Soluzione

### 1. Vai su Export v2
```
https://shop.didieffeb2b.com/admin/pages/export-v2.php
```

### 2. **IMPORTANTE**: Spunta "Export Veloce"
- ✅ Spunta: **Export Veloce (skip traduzioni prodotti)**
- Questo manterrà le traduzioni esistenti
- Ma rigenerera i metadata con il fix booleani

### 3. Click "Avvia Export"
- Aspetta 30-60 secondi
- Dovrebbe completare rapidamente

### 4. Verifica Fix
Apri frontend e controlla che i filtri mostrino:
- ✅ **Checkbox** invece di "Sì/No"

---

## 📋 Dettagli Tecnici

### File con il fix (già presente):
- `admin/includes/functions.php` (riga 2298-2302)

### Cosa fa:
```php
if (is_bool($simpleValue)) {
    'value' => $simpleValue  // ← true/false diretto
} else {
    'value' => ['it' => $simpleValue]  // ← Stringa multilingua
}
```

### Formato corretto _meta.filters:
```json
{
  "field": "Applicazione su Legno",
  "type": "checkbox",
  "options": [
    {
      "label": {"it": "Applicazione su Legno", "en": "Application on Wood"},
      "value": true  // ← Valore diretto, NON {it: true}
    }
  ]
}
```

---

## 🚨 Se Export Veloce Non Funziona

Usa export completo (più lento ma sicuro):
1. **Togli** spunta "Export Veloce"
2. **Spunta** "Forza Ritraduzione" (se vuoi ritraducere tutto)
3. Avvia export
4. Aspetta 10-15 minuti

---

## ✅ Conferma Fix Funziona

Dopo export, verifica:
1. Apri `https://shop.didieffeb2b.com/data/products.json`
2. Cerca "Applicazione su Legno"
3. Verifica che `value` sia `true` (non `{"it": true}`)
4. Apri frontend catalogo
5. I filtri booleani devono essere **checkbox**

---

**Data**: 2025-11-11
**Versione functions.php**: Con fix booleani (riga 2298-2302)
