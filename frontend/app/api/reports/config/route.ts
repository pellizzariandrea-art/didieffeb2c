// app/api/reports/config/route.ts
// API for managing report configurations (proxies to remote PHP backend)

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://shop.didieffeb2b.com';

/**
 * GET /api/reports/config
 * Get all report configurations or a specific one
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');

    // Fetch from remote backend
    const response = await fetch(`${BACKEND_URL}/admin/api/save-report-config.php`, {
      method: 'GET',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch reports from backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const allConfigs = data.reports || {};

    if (slug) {
      // Return specific report
      if (!allConfigs[slug]) {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ slug, config: allConfigs[slug] });
    }

    // Return all reports
    return NextResponse.json(allConfigs);
  } catch (error: any) {
    console.error('Error reading report config:', error);
    return NextResponse.json(
      { error: 'Failed to read report configuration' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports/config
 * Save or update a report configuration
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

    // Save to remote backend
    const response = await fetch(`${BACKEND_URL}/admin/api/save-report-config.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slug, config }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to save report' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Report configuration saved',
      slug,
    });
  } catch (error: any) {
    console.error('Error saving report config:', error);
    return NextResponse.json(
      { error: 'Failed to save report configuration' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports/config?slug=...
 * Delete a report configuration
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

    // Delete from remote backend
    const response = await fetch(`${BACKEND_URL}/admin/api/save-report-config.php?slug=${slug}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to delete report' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Report deleted',
      slug,
    });
  } catch (error: any) {
    console.error('Error deleting report config:', error);
    return NextResponse.json(
      { error: 'Failed to delete report configuration' },
      { status: 500 }
    );
  }
}
