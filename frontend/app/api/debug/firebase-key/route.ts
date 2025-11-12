// Temporary debug endpoint to test FIREBASE_SERVICE_ACCOUNT_KEY parsing
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!rawKey) {
      return NextResponse.json({
        error: 'FIREBASE_SERVICE_ACCOUNT_KEY not found',
        exists: false,
      });
    }

    // Show first and last 100 chars
    const preview = {
      first100: rawKey.substring(0, 100),
      last100: rawKey.substring(rawKey.length - 100),
      length: rawKey.length,
      type: typeof rawKey,
    };

    let parsed = null;
    let parseError = null;

    try {
      parsed = JSON.parse(rawKey);
    } catch (error: any) {
      parseError = {
        message: error.message,
        position: error.message.match(/position (\d+)/)?.[1],
      };

      // Show characters around the error position
      if (parseError.position) {
        const pos = parseInt(parseError.position);
        const start = Math.max(0, pos - 50);
        const end = Math.min(rawKey.length, pos + 50);
        parseError.context = rawKey.substring(start, end);
        parseError.charAtError = rawKey.charCodeAt(pos);
      }
    }

    return NextResponse.json({
      exists: true,
      preview,
      parsed: parsed ? {
        type: parsed.type,
        project_id: parsed.project_id,
        hasPrivateKey: !!parsed.private_key,
        client_email: parsed.client_email,
      } : null,
      parseError,
      success: !!parsed,
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
