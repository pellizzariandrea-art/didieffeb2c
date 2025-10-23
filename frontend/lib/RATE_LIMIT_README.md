# Rate Limiting

## Overview

Implementazione di Rate Limiting per Next.js API Routes per prevenire abuso e attacchi DoS (Denial of Service).

**Implementazione attuale:** In-memory storage (Map)
**Scalabile a:** Redis/Upstash per production multi-instance

## Come funziona

1. **Client fa richiesta**: Il server identifica il client (IP o User ID)
2. **Server conta richieste**: Traccia numero di richieste nella finestra temporale
3. **Verifica limite**: Se limite superato, ritorna 429 Too Many Requests
4. **Reset automatico**: Counter si resetta dopo la finestra temporale

## Architettura

### Sliding Window Algorithm

```
Time Window: 60 secondi
Max Requests: 10

Richieste:  |-----|-----|-----|-----|-----| ... (fino a 10)
            ^                               ^
          Start                           End (reset)
```

### Storage

**Development/Single Instance:** In-memory Map
- ✅ Veloce, nessuna dipendenza
- ❌ Non funziona con più istanze
- ❌ Si resetta al reload server

**Production/Scale:** Upstash Redis (opzionale)
- ✅ Funziona con load balancer
- ✅ Persistente
- ✅ Distribuito

## Utilizzo

### 1. Applicare a nuova API Route

```typescript
// app/api/your-endpoint/route.ts
import { rateLimit, RateLimitPresets } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Applica rate limiting
  const rateLimitResult = await rateLimit(request, RateLimitPresets.standard);

  if (rateLimitResult.limited && rateLimitResult.response) {
    return rateLimitResult.response;
  }

  // Your API logic...
  const response = NextResponse.json({ success: true });

  // Optional: Aggiungi rate limit headers
  return applyRateLimitHeaders(response, rateLimitResult);
}
```

### 2. Configurazioni Preset

```typescript
import { RateLimitPresets } from '@/lib/rate-limit';

// Strict: 5 req/min - Login, pagamenti, azioni sensibili
RateLimitPresets.strict

// Standard: 30 req/min - API normali
RateLimitPresets.standard

// Relaxed: 100 req/min - Endpoint pubblici di lettura
RateLimitPresets.relaxed

// Admin: 10 req/min - Endpoint amministrativi
RateLimitPresets.admin
```

### 3. Configurazione Custom

```typescript
const rateLimitResult = await rateLimit(request, {
  maxRequests: 50,           // 50 richieste
  windowSeconds: 120,        // in 2 minuti
  keyGenerator: 'ip',        // Identifica per IP
  message: 'Custom error',   // Messaggio personalizzato
  skipInDev: true,           // Disabilita in development
});
```

### 4. Key Generators

```typescript
// Per IP address (default)
keyGenerator: 'ip'

// Per User ID autenticato
keyGenerator: 'user'

// Custom logic
keyGenerator: (request) => {
  const userId = request.headers.get('x-user-id');
  const apiKey = request.headers.get('x-api-key');
  return `custom:${userId || apiKey || 'anonymous'}`;
}
```

## API Routes Protette

- ✅ `POST /api/cache/refresh` - Admin preset (10 req/min)
- ✅ `GET /api/logs` - Admin preset (10 req/min)

## Response Headers

Quando rate limiting è attivo, la response include header informativi:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1704123456789

...response body...
```

Quando limite superato:

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1704123456789
Retry-After: 45

{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 45
}
```

## Upgrade a Redis/Upstash (Production)

Per scalare a multiple instances, sostituisci l'implementazione in-memory con Redis:

### 1. Setup Upstash Redis

```bash
# Create account: https://upstash.com
# Create Redis database
# Get connection URL
```

### 2. Installare dipendenze

```bash
npm install @upstash/redis
```

### 3. Configurare environment

```bash
# .env.local
UPSTASH_REDIS_REST_URL=https://your-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

### 4. Modificare lib/rate-limit.ts

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function rateLimit(/* ... */) {
  // Invece di Map in-memory, usa Redis
  const count = await redis.incr(clientKey);

  if (count === 1) {
    await redis.expire(clientKey, windowSeconds);
  }

  if (count > maxRequests) {
    // Return rate limit error
  }

  // ...
}
```

## Testing

```bash
# Test rate limiting con curl
for i in {1..15}; do
  echo "Request $i:"
  curl -H "Authorization: Bearer YOUR_TOKEN" \
       http://localhost:3000/api/cache/refresh \
       -X POST \
       -H "x-csrf-token: YOUR_CSRF_TOKEN" \
       -v 2>&1 | grep -E "< (HTTP|X-RateLimit)"
  sleep 1
done

# Dopo 10 richieste dovresti vedere 429
```

## Best Practices

1. ✅ **Combina con autenticazione**: Rate limiting + auth = migliore sicurezza
2. ✅ **Usa preset appropriati**: Strict per azioni sensibili, Relaxed per letture
3. ✅ **Monitora metriche**: Traccia quante volte il limite viene superato
4. ✅ **Comunica chiaramente**: Usa Retry-After header
5. ✅ **Documenta limiti**: Specifica limiti nella API documentation
6. ⚠️ **Attenzione a proxy**: Verifica che IP detection funzioni dietro load balancer

## Limitazioni Implementazione Attuale

- ❌ **In-memory storage**: Non funziona con più istanze Vercel/Serverless
- ❌ **Nessuna persistenza**: Reset al riavvio server
- ❌ **Cleanup periodico**: Richiede cleanup manuale entries scadute
- ⚠️ **IP detection**: Potrebbe non funzionare correttamente dietro alcuni proxy

**Soluzione:** Upgrade a Redis/Upstash per production.

## Metriche e Monitoring (Opzionale)

```typescript
// lib/rate-limit-metrics.ts
export async function logRateLimitEvent(
  clientKey: string,
  endpoint: string,
  action: 'allowed' | 'blocked'
) {
  // Send to analytics (Vercel Analytics, Datadog, etc.)
  console.log(`[RateLimit] ${action.toUpperCase()}: ${clientKey} → ${endpoint}`);
}

// Usa in rate-limit.ts
if (clientData.count > maxRequests) {
  await logRateLimitEvent(clientKey, request.url, 'blocked');
  // ...
}
```

## Riferimenti

- [OWASP Rate Limiting](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
- [Upstash Redis](https://upstash.com)
- [Vercel Rate Limiting](https://vercel.com/docs/concepts/limits/rate-limiting)
