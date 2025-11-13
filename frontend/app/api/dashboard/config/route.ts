// app/api/dashboard/config/route.ts
// API for managing dashboard KPI configurations (proxies to remote PHP backend)

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://shop.didieffeb2b.com';
const LOCAL_CONFIG_PATH = path.join(process.cwd(), '..', 'admin', 'data', 'dashboard-config.json');

/**
 * GET /api/dashboard/config
 * Get all dashboard KPI configurations or a specific one
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');

    let allConfigs: Record<string, any> = {};

    // Try to fetch from remote backend first
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
      // Fallback to local file in development
      console.log('[Dashboard Config] Backend not available, using local file');
      if (fs.existsSync(LOCAL_CONFIG_PATH)) {
        const fileContent = fs.readFileSync(LOCAL_CONFIG_PATH, 'utf-8');
        allConfigs = JSON.parse(fileContent);
      } else {
        allConfigs = {};
      }
    }

    if (slug) {
      // Return specific KPI
      if (!allConfigs[slug]) {
        return NextResponse.json(
          { error: 'KPI not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ slug, config: allConfigs[slug] });
    }

    // Return all KPIs
    return NextResponse.json(allConfigs);
  } catch (error: any) {
    console.error('Error reading dashboard config:', error);
    return NextResponse.json(
      { error: 'Failed to read dashboard configuration' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/config
 * Save or update a dashboard KPI configuration
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const token = request.headers.get('Authorization');
    // if (!isValidAdminToken(token)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    const { slug, config } = body;

    if (!slug || !config) {
      return NextResponse.json(
        { error: 'Missing slug or config' },
        { status: 400 }
      );
    }

    // Try to save to remote backend first
    try {
      const response = await fetch(`${BACKEND_URL}/admin/api/save-dashboard-config.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug, config }),
      });

      if (response.ok) {
        return NextResponse.json({
          success: true,
          message: 'Dashboard KPI configuration saved',
          slug,
        });
      } else {
        throw new Error('Backend not available');
      }
    } catch (backendError) {
      // Fallback to local file in development
      console.log('[Dashboard Config] Backend not available, saving to local file');

      let allConfigs: Record<string, any> = {};
      if (fs.existsSync(LOCAL_CONFIG_PATH)) {
        const fileContent = fs.readFileSync(LOCAL_CONFIG_PATH, 'utf-8');
        allConfigs = JSON.parse(fileContent);
      }

      allConfigs[slug] = config;
      fs.writeFileSync(LOCAL_CONFIG_PATH, JSON.stringify(allConfigs, null, 2), 'utf-8');

      return NextResponse.json({
        success: true,
        message: 'Dashboard KPI configuration saved (local)',
        slug,
      });
    }
  } catch (error: any) {
    console.error('Error saving dashboard config:', error);
    return NextResponse.json(
      { error: 'Failed to save dashboard configuration' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dashboard/config?slug=...
 * Delete a dashboard KPI configuration
 */
export async function DELETE(request: NextRequest) {
  try {
    // TODO: Add admin authentication check

    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Missing slug parameter' },
        { status: 400 }
      );
    }

    // Try to delete from remote backend first
    try {
      const response = await fetch(`${BACKEND_URL}/admin/api/save-dashboard-config.php?slug=${slug}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        return NextResponse.json({
          success: true,
          message: 'Dashboard KPI deleted',
          slug,
        });
      } else {
        throw new Error('Backend not available');
      }
    } catch (backendError) {
      // Fallback to local file in development
      console.log('[Dashboard Config] Backend not available, deleting from local file');

      if (!fs.existsSync(LOCAL_CONFIG_PATH)) {
        return NextResponse.json(
          { error: 'Config file not found' },
          { status: 404 }
        );
      }

      const fileContent = fs.readFileSync(LOCAL_CONFIG_PATH, 'utf-8');
      const allConfigs = JSON.parse(fileContent);

      if (!allConfigs[slug]) {
        return NextResponse.json(
          { error: 'KPI not found' },
          { status: 404 }
        );
      }

      delete allConfigs[slug];
      fs.writeFileSync(LOCAL_CONFIG_PATH, JSON.stringify(allConfigs, null, 2), 'utf-8');

      return NextResponse.json({
        success: true,
        message: 'Dashboard KPI deleted (local)',
        slug,
      });
    }
  } catch (error: any) {
    console.error('Error deleting dashboard config:', error);
    return NextResponse.json(
      { error: 'Failed to delete dashboard configuration' },
      { status: 500 }
    );
  }
}
