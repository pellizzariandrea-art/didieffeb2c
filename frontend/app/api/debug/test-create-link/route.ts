// Debug endpoint to test link generation
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function GET(req: NextRequest) {
  try {
    // Simulate token generation
    const setupToken = randomBytes(32).toString('hex');

    // Test URL generation like in create user endpoint
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/');
    const vercelUrl = process.env.VERCEL_URL;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    const actualBaseUrl = vercelUrl
      ? `https://${vercelUrl}`
      : baseUrl
      || origin
      || req.headers.get('referer')?.split('/').slice(0, 3).join('/')
      || 'http://localhost:3000';

    const resetLink = `${actualBaseUrl}/auth/setup-password?token=${setupToken}`;

    return NextResponse.json({
      tokenGenerated: setupToken,
      tokenLength: setupToken.length,
      headers: {
        origin: req.headers.get('origin'),
        referer: req.headers.get('referer'),
      },
      env: {
        VERCEL_URL: process.env.VERCEL_URL || 'NOT_SET',
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'NOT_SET',
      },
      baseUrlUsed: actualBaseUrl,
      finalLink: resetLink,
      linkHasToken: resetLink.includes('?token='),
      tokenInLink: resetLink.split('?token=')[1]?.substring(0, 20) + '...',
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
