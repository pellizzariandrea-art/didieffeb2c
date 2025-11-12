// API route to get email logs (Admin only)
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    // Get ID token from Authorization header
    const authHeader = request.headers.get('authorization');
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'Non autenticato' },
        { status: 401 }
      );
    }

    // Verify ID token and check admin role
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Get user profile to check role
    const db = getAdminFirestore();
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (userData?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Accesso negato' },
        { status: 403 }
      );
    }

    // Get email logs (last 100)
    const logsSnapshot = await db
      .collection('email_logs')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const logs = logsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        to: data.to,
        subject: data.subject,
        status: data.status,
        templateSlug: data.templateSlug,
        messageId: data.messageId,
        error: data.error,
        brevoResponse: data.brevoResponse,
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        sentAt: data.sentAt?.toDate?.() || (data.sentAt ? new Date(data.sentAt) : undefined),
      };
    });

    return NextResponse.json({
      success: true,
      logs,
    });

  } catch (error: any) {
    console.error('Error fetching email logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Errore durante il recupero dei log',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
