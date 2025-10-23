// lib/csrf.ts
// CSRF (Cross-Site Request Forgery) Protection for Next.js API Routes
// Uses Double Submit Cookie pattern with SameSite cookies

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';

const CSRF_TOKEN_COOKIE = 'csrf_token';
const CSRF_TOKEN_HEADER = 'x-csrf-token';
const TOKEN_LENGTH = 32;

/**
 * Genera un token CSRF sicuro
 */
export function generateCsrfToken(): string {
  return randomBytes(TOKEN_LENGTH).toString('base64url');
}

/**
 * Verifica che il token CSRF sia valido
 */
export function verifyCsrfToken(cookieToken: string | undefined, headerToken: string | null): boolean {
  if (!cookieToken || !headerToken) {
    return false;
  }

  // Confronto constant-time per evitare timing attacks
  const cookieHash = createHash('sha256').update(cookieToken).digest('hex');
  const headerHash = createHash('sha256').update(headerToken).digest('hex');

  return cookieHash === headerHash;
}

/**
 * Middleware per proteggere API routes da CSRF attacks
 * Usa Double Submit Cookie pattern
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const csrfCheck = await validateCsrf(request);
 *   if (csrfCheck.error) {
 *     return csrfCheck.error;
 *   }
 *
 *   // ... tua logica API
 * }
 * ```
 */
export async function validateCsrf(request: NextRequest): Promise<{
  valid: boolean;
  error?: NextResponse;
}> {
  // Estrai token dal cookie e dall'header
  const cookieToken = request.cookies.get(CSRF_TOKEN_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);

  // Verifica token
  const isValid = verifyCsrfToken(cookieToken, headerToken);

  if (!isValid) {
    return {
      valid: false,
      error: NextResponse.json(
        {
          success: false,
          error: 'CSRF token validation failed',
          message: 'Invalid or missing CSRF token. Please refresh the page and try again.'
        },
        { status: 403 }
      ),
    };
  }

  return { valid: true };
}

/**
 * Endpoint per ottenere un nuovo CSRF token
 * Usare in una API route GET per fornire il token al client
 *
 * @example
 * ```typescript
 * // app/api/csrf-token/route.ts
 * export async function GET() {
 *   return getCsrfTokenResponse();
 * }
 * ```
 */
export function getCsrfTokenResponse(): NextResponse {
  const token = generateCsrfToken();

  const response = NextResponse.json({
    success: true,
    token,
  });

  // Imposta cookie con il token (SameSite=Lax per sicurezza)
  response.cookies.set(CSRF_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 ore
  });

  return response;
}

/**
 * Helper per client-side: ottiene il token CSRF dal server
 *
 * @example
 * ```typescript
 * const token = await fetchCsrfToken();
 *
 * await fetch('/api/some-endpoint', {
 *   method: 'POST',
 *   headers: {
 *     'x-csrf-token': token,
 *     'Content-Type': 'application/json',
 *   },
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export async function fetchCsrfToken(): Promise<string> {
  const response = await fetch('/api/csrf-token');
  const data = await response.json();
  return data.token;
}
