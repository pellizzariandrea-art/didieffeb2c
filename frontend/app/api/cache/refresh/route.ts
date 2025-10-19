// app/api/cache/refresh/route.ts
// API endpoint per forzare il refresh della cache prodotti

import { NextRequest, NextResponse } from 'next/server';
import { refreshCache, getCacheInfo } from '@/lib/server/products-cache';

export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json({
        success: true,
        message: 'Cache refreshed successfully',
        cache: info,
      });
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
