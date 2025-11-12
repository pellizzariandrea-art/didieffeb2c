// API route to validate password setup token
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token mancante' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const tokenDoc = await db.collection('password_setup_tokens').doc(token).get();

    if (!tokenDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Token non valido' },
        { status: 404 }
      );
    }

    const tokenData = tokenDoc.data();

    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Token non valido' },
        { status: 404 }
      );
    }

    // Check if token is already used
    if (tokenData.used) {
      return NextResponse.json(
        { success: false, error: 'Token già utilizzato' },
        { status: 400 }
      );
    }

    // Check if token is expired
    const expiresAt = tokenData.expiresAt?.toDate();
    if (!expiresAt || expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Token scaduto' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: tokenData.userId,
        email: tokenData.email,
      },
    });

  } catch (error: any) {
    console.error('Validate token error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Errore durante la validazione del token',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
