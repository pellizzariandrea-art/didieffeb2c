// app/api/queries/config/route.ts
// API for managing SQL query configurations (proxies to remote PHP backend)

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://shop.didieffeb2b.com';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');

    // Fetch from remote backend
    const response = await fetch(`${BACKEND_URL}/admin/api/save-query-config.php`, {
      method: 'GET',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch queries from backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const allQueries = data.queries || {};

    if (slug) {
      if (!allQueries[slug]) {
        return NextResponse.json(
          { error: 'Query not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ slug, query: allQueries[slug] });
    }

    return NextResponse.json(allQueries);
  } catch (error: any) {
    console.error('Error reading query config:', error);
    return NextResponse.json(
      { error: 'Failed to read query configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, query } = body;

    if (!slug || !query) {
      return NextResponse.json(
        { error: 'Missing slug or query' },
        { status: 400 }
      );
    }

    // Save to remote backend
    const response = await fetch(`${BACKEND_URL}/admin/api/save-query-config.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slug, query }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to save query' },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Query configuration saved',
      slug,
    });
  } catch (error: any) {
    console.error('Error saving query config:', error);
    return NextResponse.json(
      { error: 'Failed to save query configuration' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Missing slug parameter' },
        { status: 400 }
      );
    }

    // Delete from remote backend
    const response = await fetch(`${BACKEND_URL}/admin/api/save-query-config.php?slug=${slug}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to delete query' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Query deleted',
      slug,
    });
  } catch (error: any) {
    console.error('Error deleting query config:', error);
    return NextResponse.json(
      { error: 'Failed to delete query configuration' },
      { status: 500 }
    );
  }
}
