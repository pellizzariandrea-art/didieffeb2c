// app/api/users/update-profile/route.ts
// API endpoint to update user profile in Firestore

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
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

    // Verify ID token
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Get profile data from request
    const profileData = await request.json();

    // Validate required fields
    if (!profileData.nome || !profileData.cognome) {
      return NextResponse.json(
        { success: false, error: 'Nome e cognome sono obbligatori' },
        { status: 400 }
      );
    }

    // Get current user profile to check role
    const db = getAdminFirestore();
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Utente non trovato' },
        { status: 404 }
      );
    }

    const currentData = userDoc.data();

    // Prepare update data (exclude email as it's not modifiable)
    const updateData: any = {
      nome: profileData.nome,
      cognome: profileData.cognome,
      telefono: profileData.telefono || '',
      updatedAt: new Date().toISOString(),
    };

    // Add tax fields (available for all users)
    updateData.partitaIVA = profileData.partitaIVA || '';
    updateData.codiceFiscale = profileData.codiceFiscale || '';

    // Add main address fields (billing address - available for all users)
    updateData.indirizzo = profileData.indirizzo || '';
    updateData.citta = profileData.citta || '';
    updateData.cap = profileData.cap || '';
    updateData.provincia = profileData.provincia || '';
    updateData.paese = profileData.paese || '';

    // Add B2B-specific company fields
    if (currentData?.accountType === 'company' || currentData?.role === 'b2b') {
      updateData.ragioneSociale = profileData.ragioneSociale || '';
      updateData.codiceSDI = profileData.codiceSDI || '';
    }

    // Update user document in Firestore
    await db.collection('users').doc(uid).update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Profilo aggiornato con successo',
    });

  } catch (error: any) {
    console.error('Update profile error:', error);

    // Handle specific error cases
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { success: false, error: 'Sessione scaduta' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Errore durante l\'aggiornamento del profilo',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
