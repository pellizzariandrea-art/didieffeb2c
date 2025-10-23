// app/api/cache/refresh/route.ts
// API endpoint per forzare il refresh della cache prodotti

import { NextRequest, NextResponse } from 'next/server';
import { refreshCache, getCacheInfo } from '@/lib/server/products-cache';
import { validateCsrf } from '@/lib/csrf';
import { rateLimit, RateLimitPresets, applyRateLimitHeaders } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Rate limiting (admin preset: 10 req/min)
    const rateLimitResult = await rateLimit(request, RateLimitPresets.admin);
    if (rateLimitResult.limited && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    // SECURITY: Verifica CSRF token (defense-in-depth)
    const csrfCheck = await validateCsrf(request);
    if (!csrfCheck.valid && csrfCheck.error) {
      return csrfCheck.error;
    }

    // Verifica autenticazione (opzionale, usa lo stesso token dei log)
    const authHeader = request.headers.get('authorization');
    const token = process.env.ADMIN_API_TOKEN;

    if (token && authHeader !== `Bearer ${token}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Forza refresh della cache
    const success = await refreshCache();

    if (success) {
      const info = getCacheInfo();
      const response = NextResponse.json({
        success: true,
        message: 'Cache refreshed successfully',
        cache: info,
      });

      // Aggiungi rate limit headers
      return applyRateLimitHeaders(response, rateLimitResult);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to refresh cache'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error refreshing cache:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verifica autenticazione (opzionale)
    const authHeader = request.headers.get('authorization');
    const token = process.env.ADMIN_API_TOKEN;

    if (token && authHeader !== `Bearer ${token}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Restituisci info sulla cache
    const info = getCacheInfo();
    return NextResponse.json({
      success: true,
      cache: info,
    });
  } catch (error) {
    console.error('Error getting cache info:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
