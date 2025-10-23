// lib/rate-limit.ts
// Rate Limiting per Next.js API Routes
// Usa in-memory storage (Map) per development
// Compatibile con Upstash Redis per production scale

import { NextRequest, NextResponse } from 'next/server';

// In-memory storage per development
// In production, sostituire con Redis/Upstash
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  /**
   * Numero massimo di richieste permesse nella finestra temporale
   * @default 10
   */
  maxRequests?: number;

  /**
   * Finestra temporale in secondi
   * @default 60 (1 minuto)
   */
  windowSeconds?: number;

  /**
   * Chiave per identificare il client
   * - 'ip': IP address (default)
   * - 'user': User ID (se autenticato)
   * - function: Custom key generator
   * @default 'ip'
   */
  keyGenerator?: 'ip' | 'user' | ((request: NextRequest) => string);

  /**
   * Messaggio di errore personalizzato
   */
  message?: string;

  /**
   * Skip rate limiting in development
   * @default false
   */
  skipInDev?: boolean;
}

/**
 * Genera una chiave univoca per il client
 */
function generateClientKey(request: NextRequest, config: RateLimitConfig): string {
  const { keyGenerator = 'ip' } = config;

  if (typeof keyGenerator === 'function') {
    return keyGenerator(request);
  }

  if (keyGenerator === 'ip') {
    // Ottieni IP da header (supporta proxy/load balancer)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
    return `ip:${ip}`;
  }

  if (keyGenerator === 'user') {
    // Usa user ID da auth header o session
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      return `user:${authHeader}`;
    }
    return 'user:anonymous';
  }

  return 'default';
}

/**
 * Pulisce le entries scadute dalla cache in-memory
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }
}

/**
 * Rate limiter middleware per API routes
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = await rateLimit(request, {
 *     maxRequests: 5,
 *     windowSeconds: 60,
 *   });
 *
 *   if (rateLimitResult.limited) {
 *     return rateLimitResult.response;
 *   }
 *
 *   // Your API logic here
 * }
 * ```
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = {}
): Promise<{
  limited: boolean;
  response?: NextResponse;
  remaining: number;
  limit: number;
  reset: number;
}> {
  const {
    maxRequests = 10,
    windowSeconds = 60,
    message = 'Too many requests. Please try again later.',
    skipInDev = false,
  } = config;

  // Skip in development se configurato
  if (skipInDev && process.env.NODE_ENV === 'development') {
    return {
      limited: false,
      remaining: maxRequests,
      limit: maxRequests,
      reset: Date.now() + windowSeconds * 1000,
    };
  }

  // Cleanup periodico (ogni 100 richieste)
  if (requestCounts.size > 100 && Math.random() < 0.01) {
    cleanupExpiredEntries();
  }

  // Genera chiave client
  const clientKey = generateClientKey(request, config);
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  // Ottieni o crea entry per questo client
  let clientData = requestCounts.get(clientKey);

  // Se non esiste o è scaduta, crea nuova entry
  if (!clientData || now > clientData.resetTime) {
    clientData = {
      count: 0,
      resetTime: now + windowMs,
    };
    requestCounts.set(clientKey, clientData);
  }

  // Incrementa contatore
  clientData.count++;

  // Calcola valori di rate limit
  const remaining = Math.max(0, maxRequests - clientData.count);
  const reset = clientData.resetTime;
  const retryAfter = Math.ceil((reset - now) / 1000);

  // Verifica se limite superato
  if (clientData.count > maxRequests) {
    const response = NextResponse.json(
      {
        success: false,
        error: 'Rate limit exceeded',
        message,
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': retryAfter.toString(),
        },
      }
    );

    return {
      limited: true,
      response,
      remaining: 0,
      limit: maxRequests,
      reset,
    };
  }

  // Rate limit OK
  return {
    limited: false,
    remaining,
    limit: maxRequests,
    reset,
  };
}

/**
 * Applica rate limit headers alla response
 * Utile per aggiungere informazioni di rate limiting anche quando il limite non è superato
 */
export function applyRateLimitHeaders(
  response: NextResponse,
  rateLimitResult: Awaited<ReturnType<typeof rateLimit>>
): NextResponse {
  response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());

  return response;
}

/**
 * Preset configurazioni rate limit per scenari comuni
 */
export const RateLimitPresets = {
  /**
   * Strict: Per endpoint molto sensibili (es: login, pagamenti)
   * 5 richieste / minuto
   */
  strict: {
    maxRequests: 5,
    windowSeconds: 60,
  },

  /**
   * Standard: Per endpoint API normali
   * 30 richieste / minuto
   */
  standard: {
    maxRequests: 30,
    windowSeconds: 60,
  },

  /**
   * Relaxed: Per endpoint pubblici di lettura
   * 100 richieste / minuto
   */
  relaxed: {
    maxRequests: 100,
    windowSeconds: 60,
  },

  /**
   * Admin: Per endpoint amministrativi
   * 10 richieste / minuto
   */
  admin: {
    maxRequests: 10,
    windowSeconds: 60,
  },
} as const;
