// app/api/csrf-token/route.ts
// Endpoint per ottenere un CSRF token

import { getCsrfTokenResponse } from '@/lib/csrf';

/**
 * GET /api/csrf-token
 *
 * Genera e restituisce un nuovo CSRF token.
 * Il token viene anche salvato in un httpOnly cookie per la validazione successiva.
 *
 * @returns { success: true, token: string }
 *
 * @example
 * ```typescript
 * // Client-side usage
 * const response = await fetch('/api/csrf-token');
 * const { token } = await response.json();
 *
 * // Use token in subsequent POST requests
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
export async function GET() {
  return getCsrfTokenResponse();
}
