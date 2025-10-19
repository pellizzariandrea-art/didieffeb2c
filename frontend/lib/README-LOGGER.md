# Sistema di Logging

## Panoramica

Il sistema di logging dell'applicazione permette di tracciare eventi e errori su file giornalieri con rotazione automatica.

## Caratteristiche

- ✅ **Log giornalieri**: Un file per ogni giorno nel formato `app-YYYY-MM-DD.log`
- ✅ **Rotazione automatica**: Elimina log più vecchi di 30 giorni
- ✅ **Livelli di log**: `info`, `warn`, `error`, `debug`
- ✅ **Formato JSON**: Ogni riga è un oggetto JSON per facilitare il parsing
- ✅ **Solo server-side**: Non impatta le performance del browser

## Ubicazione dei Log

```
ecommerce/frontend/logs/
├── app-2025-01-15.log
├── app-2025-01-16.log
└── app-2025-01-17.log
```

## Uso

### Server-side (API Routes, Server Components)

```typescript
import { logInfo, logWarn, logError, logDebug } from '@/lib/logger';

// Log semplice
logInfo('User logged in');

// Log con componente
logInfo('Product fetched', {
  component: 'ProductAPI',
  data: { productId: '123' }
});

// Log di errore
logError('Database connection failed', {
  component: 'Database',
  data: { error: err.message }
});

// Log di warning
logWarn('Slow query detected', {
  component: 'ProductQuery',
  data: { duration: '5.2s' }
});

// Log di debug (solo in development)
logDebug('Cache hit', {
  component: 'Cache',
  data: { key: 'products:all' }
});
```

### Client-side (Browser)

Per i componenti client ('use client'), usa il wrapper browserLog come in AIDescription.tsx:

```typescript
const browserLog = {
  info: (msg: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ComponentName] ${msg}`, data || '');
    }
  },
  error: (msg: string, error?: any) => {
    console.error(`[ComponentName] ${msg}`, error || '');
  }
};

// Utilizzo
browserLog.info('Request started', { productId: '123' });
browserLog.error('Request failed', error);
```

## Formato del Log

Ogni riga del file log è un oggetto JSON:

```json
{
  "timestamp": "2025-01-17T10:30:45.123Z",
  "level": "info",
  "component": "AIDescription",
  "message": "Generated description for product",
  "data": {
    "productCode": "FAM001",
    "language": "it"
  }
}
```

## Configurazione

### Cambiare il periodo di retention

Modifica la costante in `lib/logger.ts`:

```typescript
const MAX_LOG_AGE_DAYS = 30; // Cambia questo valore
```

### Abilitare/Disabilitare log in produzione

I log su file sono sempre abilitati. I log su console sono visibili solo in development:

```typescript
if (process.env.NODE_ENV === 'development') {
  console.log(...); // Solo in development
}
```

## Analisi dei Log

### Filtrare per livello

```bash
# Solo errori
grep '"level":"error"' logs/app-2025-01-17.log

# Solo warning
grep '"level":"warn"' logs/app-2025-01-17.log
```

### Filtrare per componente

```bash
# Solo log di AIDescription
grep '"component":"AIDescription"' logs/app-2025-01-17.log
```

### Parsing con jq

```bash
# Formattare in modo leggibile
cat logs/app-2025-01-17.log | jq '.'

# Estrarre solo i messaggi
cat logs/app-2025-01-17.log | jq '.message'

# Filtrare per timestamp
cat logs/app-2025-01-17.log | jq 'select(.timestamp > "2025-01-17T10:00:00")'
```

## Best Practices

1. **Usa i livelli appropriati**:
   - `info`: Operazioni normali (es: "User logged in", "Product fetched")
   - `warn`: Situazioni anomale non bloccanti (es: "Slow query", "Cache miss")
   - `error`: Errori che richiedono attenzione (es: "Database error", "API failed")
   - `debug`: Info dettagliate per debugging (solo development)

2. **Includi contesto**:
   ```typescript
   // ❌ Non abbastanza informazioni
   logError('Failed');

   // ✅ Con contesto utile
   logError('Failed to fetch product', {
     component: 'ProductAPI',
     data: { productId: '123', error: err.message }
   });
   ```

3. **Non loggare dati sensibili**:
   ```typescript
   // ❌ NO
   logInfo('User data', { password: '...', creditCard: '...' });

   // ✅ SI
   logInfo('User logged in', { userId: '123', email: 'u***@email.com' });
   ```

4. **Usa componenti consistenti**:
   ```typescript
   // Buona pratica: nome componente consistente
   logInfo('Started', { component: 'ProductAPI' });
   logInfo('Completed', { component: 'ProductAPI' });
   ```

## Troubleshooting

### I log non vengono creati

- Verifica che la directory `logs/` esista e sia scrivibile
- Controlla i permessi del filesystem
- Verifica che il codice venga eseguato server-side (non in browser)

### La rotazione non funziona

- La pulizia viene eseguita all'avvio dell'applicazione
- Riavvia il server Next.js per triggare la pulizia

### Troppi log

- Riduci i log di tipo `debug`
- Aumenta il log level minimo
- Implementa rate limiting per log ripetitivi

## Esempi Completi

Vedi `components/AIDescription.tsx` per un esempio completo di logging client-side con wrapper browserLog.
