# CSRF Protection

## Overview

Implementazione di protezione CSRF (Cross-Site Request Forgery) per Next.js API Routes usando il pattern **Double Submit Cookie**.

## Come funziona

1. **Client richiede token**: Chiama `GET /api/csrf-token`
2. **Server genera token**: Crea token random e lo salva in cookie httpOnly
3. **Client usa token**: Include token nell'header `x-csrf-token` per richieste POST/PUT/DELETE
4. **Server valida**: Confronta cookie token con header token

## Utilizzo

### 1. Proteggere una nuova API Route

```typescript
// app/api/your-endpoint/route.ts
import { validateCsrf } from '@/lib/csrf';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Valida CSRF token
  const csrfCheck = await validateCsrf(request);
  if (!csrfCheck.valid && csrfCheck.error) {
    return csrfCheck.error;
  }

  // La tua logica qui
  // ...

  return NextResponse.json({ success: true });
}
```

### 2. Client-side: Ottenere il token

```typescript
// Opzione A: Helper function
import { fetchCsrfToken } from '@/lib/csrf';

const token = await fetchCsrfToken();

await fetch('/api/your-endpoint', {
  method: 'POST',
  headers: {
    'x-csrf-token': token,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});
```

```typescript
// Opzione B: Manuale
const response = await fetch('/api/csrf-token');
const { token } = await response.json();

await fetch('/api/your-endpoint', {
  method: 'POST',
  headers: {
    'x-csrf-token': token,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});
```

### 3. React Hook per CSRF (opzionale)

```typescript
// hooks/useCsrf.ts
import { useState, useEffect } from 'react';

export function useCsrf() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/csrf-token')
      .then(res => res.json())
      .then(data => {
        setToken(data.token);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch CSRF token:', err);
        setLoading(false);
      });
  }, []);

  return { token, loading };
}

// Uso nel componente:
function MyComponent() {
  const { token, loading } = useCsrf();

  const handleSubmit = async () => {
    if (!token) return;

    await fetch('/api/some-endpoint', {
      method: 'POST',
      headers: {
        'x-csrf-token': token,
      },
      body: JSON.stringify(data),
    });
  };
}
```

## API Routes protette attualmente

- ✅ `POST /api/cache/refresh` - Cache refresh endpoint (ha anche autenticazione Bearer)

## Configurazione

### Cookie Settings

Il token CSRF è salvato in un cookie con:
- `httpOnly: true` - Non accessibile da JavaScript (prevenire XSS)
- `secure: true` (production) - Solo HTTPS
- `sameSite: 'lax'` - Protezione base CSRF
- `maxAge: 24h` - Scadenza 24 ore

### Headers richiesti

- Header cookie: `csrf_token` (automatico dal browser)
- Header custom: `x-csrf-token` (deve essere inviato dal client)

## Sicurezza

### Protezioni implementate

1. **Double Submit Cookie**: Token deve essere sia nel cookie che nell'header
2. **httpOnly cookie**: Protegge da XSS attacks
3. **SameSite cookie**: Prima linea di difesa contro CSRF
4. **Constant-time comparison**: Previene timing attacks
5. **Crypto-secure tokens**: Usa `randomBytes` di Node.js crypto

### Limitazioni

- **Non protegge da XSS**: Se attaccante può eseguire JS, può leggere header
- **Richiede JavaScript**: Client deve fare richiesta iniziale per token
- **Stateless**: Token non è memorizzato server-side (più scalabile ma meno sicuro di session-based)

## Best Practices

1. ✅ Usa CSRF protection su **tutte le route POST/PUT/DELETE**
2. ✅ Combina con autenticazione (Bearer token, session, etc.)
3. ✅ Usa HTTPS in produzione (secure cookies)
4. ✅ Imposta CSP headers per prevenire XSS
5. ✅ Valida sempre l'input lato server

## Testing

```bash
# Ottieni token
curl http://localhost:3000/api/csrf-token -c cookies.txt

# Usa token (estrai da response)
TOKEN="your-token-here"

# Test endpoint protetto
curl -X POST http://localhost:3000/api/cache/refresh \
  -b cookies.txt \
  -H "x-csrf-token: $TOKEN" \
  -H "Content-Type: application/json"

# Test senza token (dovrebbe fallire con 403)
curl -X POST http://localhost:3000/api/cache/refresh
```

## Riferimenti

- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Double Submit Cookie Pattern](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
