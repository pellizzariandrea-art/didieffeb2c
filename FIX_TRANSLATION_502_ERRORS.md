# Fix Errori 502 e Gestione Errori Sistema Traduzione

**Data**: 2025-11-11
**Versione**: translate-process.php v2.6

---

## 🐛 Problema Identificato

Il sistema di traduzione produceva errori frequenti:

### Sintomi
```
[16:14:58] ⚠️ Errore richiesta stop: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
[16:14:58] ⚠️ Errore polling (continuo a provare): HTTP 502
```

### Root Cause
1. **Polling troppo frequente**: 500ms interval sovraccaricava il server
2. **Nessuna gestione errori 502**: Continuava a fare polling anche con server sovraccarico
3. **Parsing JSON non verificato**: Tentava di parsare HTML (pagine di errore) come JSON
4. **Codice duplicato**: Action "stop" definita due volte in translate-process.php
5. **Nessun limite errori consecutivi**: Poteva andare in loop infinito

---

## ✅ Modifiche Applicate

### 1. Frontend: `translate-products.php`

#### A. Ridotto intervallo polling
```javascript
// PRIMA (BUGGY)
pollingInterval = setInterval(pollStatus, 500); // 500ms

// DOPO (FIXED)
pollingInterval = setInterval(pollStatus, 2000); // 2 secondi
```
**Beneficio**: Riduce carico server da 120 req/min a 30 req/min

---

#### B. Aggiunto tracking errori consecutivi
```javascript
let consecutiveErrors = 0;
let maxConsecutiveErrors = 10;

// Reset su ogni nuova traduzione
consecutiveErrors = 0;

// Reset su successo
if (polling success) {
    consecutiveErrors = 0;
}
```

---

#### C. Gestione intelligente errori 502
```javascript
// Gestione specifica per errore 502
if (error.message.includes('502')) {
    if (consecutiveErrors >= maxConsecutiveErrors) {
        addLog('❌ Troppi errori 502, server sovraccarico. Processo interrotto.');
        stopTranslation();
    } else if (consecutiveErrors === 1 || consecutiveErrors % 5 === 0) {
        // Mostra solo il primo errore e poi ogni 5
        addLog('⚠️ Server sovraccarico (502), riprovo... (#' + consecutiveErrors + ')');
    }
}
```
**Beneficio**:
- Riduce spam nel log (mostra solo 1° errore, poi ogni 5°)
- Stop automatico dopo 10 errori consecutivi
- Distingue tra errori 502 e altri errori di rete

---

#### D. Verifica Content-Type prima di parsing JSON
```javascript
fetch('/admin/pages/translate-process.php?action=status')
    .then(response => {
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        // ✅ NUOVO: Verifica Content-Type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Risposta non JSON (probabilmente errore PHP)');
        }
        return response.text();
    })
```
**Beneficio**: Previene errore "Unexpected token '<'" quando server restituisce HTML

---

#### E. Migliorata gestione stop
```javascript
// Verifica Content-Type anche per stop
fetch('translate-process.php', {...})
    .then(response => {
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Risposta non JSON durante stop');
        }
        return response.json();
    })
    .catch(error => {
        // ✅ NUOVO: Non mostrare errore se già gestito
        if (!error.message.includes('DOCTYPE')) {
            addLog('⚠️ Errore richiesta stop: ' + error.message);
        }
    });
```
**Beneficio**: Elimina messaggi di errore ridondanti

---

### 2. Backend: `translate-process.php`

#### A. Rimosso codice duplicato
```php
// PRIMA: Action "stop" definita DUE VOLTE (righe 148-161 e 164-184)
if ($action === 'stop') { ... } // Prima versione
if ($action === 'stop') { ... } // Seconda versione (overwrite)

// DOPO: Una sola definizione pulita
if ($action === 'stop') {
    logDebug("ACTION: stop");
    $state = loadState();
    if ($state) {
        $state['status'] = 'stopped';
        saveState($state);
        echo json_encode(['success' => true, 'message' => 'Translation stopped']);
    } else {
        echo json_encode(['success' => false, 'error' => 'No active translation process']);
    }
    exit;
}
```

---

#### B. Ottimizzato batch size
```php
// PRIMA
$batchSize = 1; // 1 prodotto per richiesta

// DOPO
$batchSize = 2; // 2 prodotti per richiesta
```
**Beneficio**: Dimezza numero richieste polling (da 41 a ~21 per 41 prodotti)

---

#### C. Timeout più conservativo
```php
// PRIMA
$maxExecutionTime = 60; // 60 secondi (vicino a timeout PHP)

// DOPO
$maxExecutionTime = 45; // 45 secondi (margine sicurezza)
```
**Beneficio**: Previene timeout server e errori 502

---

#### D. Aggiornata versione file
```php
logDebug("*** FILE VERSION: 2.6 - Reduced polling, better error handling, optimized batch ***");
```

---

## 📊 Impatto delle Modifiche

### Prima (v2.5)
- **Polling**: Ogni 500ms (120 req/min)
- **Batch**: 1 prodotto per richiesta
- **Errori 502**: Loop infinito di retry
- **Errori JSON**: Crash con messaggio confuso
- **Timeout**: 60s (troppo vicino a limite PHP)

### Dopo (v2.6)
- **Polling**: Ogni 2s (30 req/min) → **-75% carico**
- **Batch**: 2 prodotti per richiesta → **-50% richieste totali**
- **Errori 502**: Stop automatico dopo 10, log ridotto
- **Errori JSON**: Gestione intelligente, messaggi chiari
- **Timeout**: 45s (margine sicurezza 15s)

### Performance Attese
Per 41 prodotti:
- **Richieste polling**: da ~41 a ~21 (-48%)
- **Tempo totale**: Simile (limitato da API Claude)
- **Errori 502**: Ridotti drasticamente
- **Spam log**: Ridotto da 100% a ~10-20% (solo errori significativi)

---

## 🧪 Come Testare

### 1. Test Normale
```
1. Aprire admin/pages/translate-products.php
2. Click "Avvia Traduzione"
3. Verificare:
   - Polling ogni 2 secondi (non 500ms)
   - Progresso regolare senza errori
   - Log pulito (no spam)
```

### 2. Test Resilienza (Simula errori)
```
1. Durante traduzione, fermare temporaneamente server PHP
2. Verificare:
   - Log mostra "⚠️ Server sovraccarico (502), riprovo... (#1)"
   - Log mostra "#5" dopo 5 errori (non ogni errore)
   - Dopo 10 errori consecutivi: stop automatico
```

### 3. Test Stop
```
1. Durante traduzione, click "Interrompi"
2. Verificare:
   - Nessun errore "DOCTYPE" nel log
   - Messaggio "✅ Traduzione interrotta correttamente"
   - Pulsante diventa "▶️ Riprendi Traduzione"
```

---

## 🔍 Monitoraggio

### Log da controllare
```bash
# Log processo traduzione
C:\Users\pelli\claude\ecommerce\admin\data\translation-process.log

# Cerca errori 502
grep "502" translation-process.log

# Conta polling requests
grep "ACTION: status" translation-process.log | wc -l
```

### Network Monitoring (Chrome DevTools)
1. Aprire DevTools → Network
2. Filtrare: `translate-process.php`
3. Verificare:
   - Intervallo tra richieste: ~2s
   - Status code: 200 (non 502)
   - Response: JSON valido (non HTML)

---

## 📝 Note Aggiuntive

### Se errori persistono
1. **Aumentare intervallo polling** da 2s a 5s se server ancora sovraccarico
2. **Ridurre batch size** da 2 a 1 se timeout persistenti
3. **Aumentare timeout PHP** nel server (php.ini):
   ```ini
   max_execution_time = 120
   default_socket_timeout = 120
   ```

### Mantenere output file
- Il sistema continua a salvare checkpoint dopo ogni batch
- In caso di interruzione, riprende dal checkpoint salvato
- File `products.json` viene aggiornato solo al completamento

### Compatibilità
- ✅ Compatibile con versioni precedenti di products.json
- ✅ Non richiede modifiche al database
- ✅ Nessun cambio nel formato dei dati

---

## 🚀 Prossimi Miglioramenti Possibili

1. **Adaptive polling**: Aumenta intervallo se server lento, riduce se server veloce
2. **WebSocket**: Sostituisce polling con push notifications
3. **Queue system**: Backend processa traduzioni in background (Redis/RabbitMQ)
4. **Progress indicator**: Mostra prodotto corrente in tempo reale
5. **Retry strategico**: Retry solo prodotti falliti invece di tutto il batch

---

**Status**: ✅ IMPLEMENTATO E PRONTO PER TEST

**Autore**: Claude Code
**Supervisor**: Pellino
