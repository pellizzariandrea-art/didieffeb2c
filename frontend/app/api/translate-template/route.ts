// app/api/translate-template/route.ts
// Proxy per tradurre template email tramite backend PHP

import { NextRequest, NextResponse } from 'next/server';

interface TranslationRequest {
  sourceSubject: string;
  sourceBody: string;
  targetLanguages: string[];
}

export async function POST(request: NextRequest) {
  try {
    const data: TranslationRequest = await request.json();

    // Chiama il backend PHP
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://shop.didieffeb2b.com';
    const response = await fetch(`${backendUrl}/admin/api/translate-email-template.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Errore durante la traduzione');
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Translation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Errore durante la traduzione',
      },
      { status: 500 }
    );
  }
}
