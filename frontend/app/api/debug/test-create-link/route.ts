// Debug endpoint to test link generation
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function GET(req: NextRequest) {
  try {
    // Simulate token generation
    const setupToken = randomBytes(32).toString('hex');

    // Test URL generation like in create user endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const resetLink = `${baseUrl}/auth/reset/${setupToken}`;

    return NextResponse.json({
      tokenGenerated: setupToken,
      tokenLength: setupToken.length,
      env: {
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'NOT_SET',
      },
      baseUrlUsed: baseUrl,
      finalLink: resetLink,
      linkFormat: 'path-based (not query param)',
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
