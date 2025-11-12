// API route to set password using setup token
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'Token e password sono obbligatori' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'La password deve essere di almeno 8 caratteri' },
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

    const userId = tokenData.userId;
    const email = tokenData.email;

    // Update password in Firebase Auth
    const auth = getAdminAuth();
    await auth.updateUser(userId, {
      password,
      emailVerified: true, // Auto-verify email on password setup
    });

    // Mark token as used
    await db.collection('password_setup_tokens').doc(token).update({
      used: true,
      usedAt: new Date(),
    });

    // Update user status in Firestore
    await db.collection('users').doc(userId).update({
      status: 'active',
      emailVerified: true,
      passwordSetAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`✅ Password set successfully for user: ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Password impostata con successo',
    });

  } catch (error: any) {
    console.error('Set password error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Errore durante l\'impostazione della password',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
