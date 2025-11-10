// app/api/test-query/route.ts
// Proxy per testare query SQL ed estrarre struttura colonne

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { querySlug, params, sql } = body;

    console.log('📋 Test query request:', { querySlug, sql: sql?.substring(0, 100), params });

    // Chiama il backend PHP
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://shop.didieffeb2b.com';
    const response = await fetch(`${backendUrl}/admin/api/execute-query.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: querySlug,
        params: params || {
          clientCode: 'TEST',
          dateFrom: '2024-01-01',
          dateTo: '2024-12-31',
          limit: 1,
          offset: 0,
        },
      }),
    });

    // Get response as text first to debug
    const responseText = await response.text();
    console.log('Backend response status:', response.status);

    // If 404 or backend errors, use mock mode
    const shouldUseMock =
      response.status === 404 ||
      responseText.includes('404') ||
      responseText.includes('Query config not found') ||
      responseText.includes('Invalid query slug');

    if (shouldUseMock) {
      console.log('⚠️ Backend not ready, using MOCK MODE');
      return useMockMode(querySlug, sql);
    }

    // Try to parse as JSON
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error. Response was:', responseText);
      return NextResponse.json(
        {
          success: false,
          error: 'Backend returned invalid JSON',
          details: responseText.substring(0, 500),
        },
        { status: 500 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Query execution failed',
        },
        { status: response.status }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Test query error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to execute test query',
      },
      { status: 500 }
    );
  }
}

// Mock mode: legge query-config.json locale e genera dati di esempio
async function useMockMode(querySlug: string, providedSql?: string) {
  try {
    let sql = providedSql;

    // Se SQL non fornito direttamente, cerca nel config
    if (!sql) {
      const configPath = path.join(process.cwd(), '..', 'admin', 'data', 'query-config.json');
      const configContent = await fs.readFile(configPath, 'utf-8');
      const queryConfig = JSON.parse(configContent);

      if (!queryConfig[querySlug]) {
        return NextResponse.json({
          success: false,
          error: `Query '${querySlug}' not found in local config. Provide SQL directly to test.`,
        }, { status: 404 });
      }

      const queryDef = queryConfig[querySlug];
      sql = queryDef.sql;
    }

    // Estrai nomi colonne dal SELECT usando regex
    const selectMatch = sql.match(/SELECT\s+(.*?)\s+FROM/is);
    if (!selectMatch) {
      return NextResponse.json({
        success: false,
        error: 'Cannot extract columns from SQL',
      }, { status: 400 });
    }

    // Parse colonne
    const selectClause = selectMatch[1];
    const columns = selectClause
      .split(',')
      .map(col => {
        // Estrai alias (es: "data as data_documento" -> "data_documento")
        const aliasMatch = col.trim().match(/\s+as\s+(\w+)$/i);
        if (aliasMatch) return aliasMatch[1];

        // Estrai nome campo (es: "DATE_FORMAT(data, '%Y-%m-%d')" -> estrai da AS o usa nome semplice)
        const simpleMatch = col.trim().match(/(\w+)$/);
        return simpleMatch ? simpleMatch[1] : 'unknown';
      });

    // Genera una riga di dati mock
    const mockRow: Record<string, any> = {};
    columns.forEach((col) => {
      if (col.includes('date') || col.includes('data')) {
        mockRow[col] = '2024-01-15';
      } else if (col.includes('total') || col.includes('amount') || col.includes('importo')) {
        mockRow[col] = 1234.56;
      } else if (col.includes('id') || col.includes('numero')) {
        mockRow[col] = 123;
      } else if (col.includes('anno') || col.includes('year')) {
        mockRow[col] = 2024;
      } else if (col.includes('mese') || col.includes('month')) {
        mockRow[col] = 1;
      } else {
        mockRow[col] = `Sample ${col}`;
      }
    });

    console.log('🔧 MOCK MODE - Generated columns:', columns);

    return NextResponse.json({
      success: true,
      query: querySlug,
      data: [mockRow],
      count: 1,
      _mock: true,
      _note: 'Backend not deployed, using mock data from local query-config.json',
    });
  } catch (error: any) {
    console.error('Mock mode error:', error);
    return NextResponse.json({
      success: false,
      error: 'Mock mode failed: ' + error.message,
    }, { status: 500 });
  }
}
