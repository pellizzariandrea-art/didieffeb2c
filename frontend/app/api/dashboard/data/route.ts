// app/api/dashboard/data/route.ts
// API to execute dashboard KPI queries and return data for the logged-in user

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://shop.didieffeb2b.com';
const LOCAL_CONFIG_PATH = path.join(process.cwd(), '..', 'admin', 'data', 'dashboard-config.json');

interface KPIConfig {
  title: string;
  description: string;
  query: string;
  clientCodeField: string;
  valueType: 'number' | 'currency' | 'percentage';
  format: string;
  icon: string;
  color: string;
  enabled: boolean;
  order: number;
}

interface KPIResult {
  slug: string;
  title: string;
  value: number | null;
  valueType: 'number' | 'currency' | 'percentage';
  format: string;
  icon: string;
  color: string;
  description: string;
  error?: string;
}

/**
 * GET /api/dashboard/data?clientCode=xxx
 * Execute KPI queries and return results for a specific client
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clientCode = searchParams.get('clientCode');

    if (!clientCode) {
      return NextResponse.json(
        { error: 'Missing clientCode parameter' },
        { status: 400 }
      );
    }

    // Load KPI configurations
    let allConfigs: Record<string, KPIConfig> = {};

    try {
      const response = await fetch(`${BACKEND_URL}/admin/api/save-dashboard-config.php`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        allConfigs = data.kpis || {};
      } else {
        throw new Error('Backend not available');
      }
    } catch (backendError) {
      // Fallback to local file
      if (fs.existsSync(LOCAL_CONFIG_PATH)) {
        const fileContent = fs.readFileSync(LOCAL_CONFIG_PATH, 'utf-8');
        allConfigs = JSON.parse(fileContent);
      }
    }

    // Filter only enabled KPIs and sort by order
    const enabledKpis = Object.entries(allConfigs)
      .filter(([_, config]) => config.enabled)
      .sort(([_, a], [__, b]) => a.order - b.order);

    // Execute queries (for now, return mock data since we don't have real DB)
    // TODO: When backend is ready, execute real SQL queries
    const results: KPIResult[] = await Promise.all(
      enabledKpis.map(async ([slug, config]) => {
        try {
          // Try to fetch from backend
          const response = await fetch(`${BACKEND_URL}/admin/api/execute-dashboard-query.php`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: config.query,
              clientCode,
            }),
            cache: 'no-store',
          });

          if (response.ok) {
            const data = await response.json();
            return {
              slug,
              title: config.title,
              value: data.value ?? 0,
              valueType: config.valueType,
              format: config.format,
              icon: config.icon,
              color: config.color,
              description: config.description,
            };
          } else {
            throw new Error('Backend query execution failed');
          }
        } catch (error) {
          // Return mock data for development
          console.log(`[Dashboard Data] Using mock data for ${slug}`);

          let mockValue = 0;
          if (slug === 'total_orders') {
            mockValue = 42;
          } else if (slug === 'pending_orders') {
            mockValue = 5;
          } else if (slug === 'monthly_purchases') {
            mockValue = 12500.50;
          } else if (slug === 'total_revenue') {
            mockValue = 156789.25;
          } else if (slug === 'avg_order_value') {
            mockValue = 3728.55;
          } else if (slug === 'products_ordered') {
            mockValue = 326;
          }

          return {
            slug,
            title: config.title,
            value: mockValue,
            valueType: config.valueType,
            format: config.format,
            icon: config.icon,
            color: config.color,
            description: config.description,
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      clientCode,
      kpis: results,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
