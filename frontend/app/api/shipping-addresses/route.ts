// app/api/shipping-addresses/route.ts
// API endpoint for shipping addresses CRUD operations

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';

// GET - List all shipping addresses for the current user
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

    // Verify ID token
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Get user ID from query params (for admin access)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // If userId is provided, verify user is admin
    const db = getAdminFirestore();
    let targetUid = uid;
    if (userId && userId !== uid) {
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Non autorizzato' },
          { status: 403 }
        );
      }
      targetUid = userId;
    }

    // Get addresses from subcollection
    const addressesSnapshot = await db
      .collection('users')
      .doc(targetUid)
      .collection('shipping_addresses')
      .orderBy('createdAt', 'desc')
      .get();

    // Sort addresses with default first
    const addresses = addressesSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a: any, b: any) => {
        // Default addresses first
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return 0;
      });

    return NextResponse.json({
      success: true,
      addresses,
    });

  } catch (error: any) {
    console.error('Get addresses error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Errore nel caricamento degli indirizzi',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create new shipping address
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

    // Get address data from request
    const addressData = await request.json();

    // Validate required fields
    if (!addressData.recipientName || !addressData.addressLine || !addressData.city || !addressData.postalCode || !addressData.country) {
      return NextResponse.json(
        { success: false, error: 'Campi obbligatori mancanti' },
        { status: 400 }
      );
    }

    // Get user ID from data (for admin access)
    const db = getAdminFirestore();
    const targetUid = addressData.userId || uid;

    // If userId is provided, verify user is admin
    if (addressData.userId && addressData.userId !== uid) {
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Non autorizzato' },
          { status: 403 }
        );
      }
    }

    // If this is set as default, unset other defaults
    if (addressData.isDefault) {
      const existingAddresses = await db
        .collection('users')
        .doc(targetUid)
        .collection('shipping_addresses')
        .where('isDefault', '==', true)
        .get();

      const batch = db.batch();
      existingAddresses.docs.forEach(doc => {
        batch.update(doc.ref, { isDefault: false });
      });
      await batch.commit();
    }

    // Create new address
    const newAddress = {
      recipientName: addressData.recipientName,
      addressLine: addressData.addressLine,
      city: addressData.city,
      postalCode: addressData.postalCode,
      province: addressData.province || '',
      country: addressData.country,
      phone: addressData.phone || '',
      notes: addressData.notes || '',
      isDefault: addressData.isDefault || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db
      .collection('users')
      .doc(targetUid)
      .collection('shipping_addresses')
      .add(newAddress);

    return NextResponse.json({
      success: true,
      message: 'Indirizzo salvato con successo',
      addressId: docRef.id,
    });

  } catch (error: any) {
    console.error('Create address error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Errore nel salvataggio dell\'indirizzo',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// PUT - Update existing shipping address
export async function PUT(request: NextRequest) {
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

    // Get address data from request
    const { id, userId, ...addressData } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID indirizzo mancante' },
        { status: 400 }
      );
    }

    // Get target user ID (for admin access)
    const db = getAdminFirestore();
    const targetUid = userId || uid;

    // If userId is provided, verify user is admin
    if (userId && userId !== uid) {
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Non autorizzato' },
          { status: 403 }
        );
      }
    }

    // If this is set as default, unset other defaults
    if (addressData.isDefault) {
      const existingAddresses = await db
        .collection('users')
        .doc(targetUid)
        .collection('shipping_addresses')
        .where('isDefault', '==', true)
        .get();

      const batch = db.batch();
      existingAddresses.docs.forEach(doc => {
        if (doc.id !== id) {
          batch.update(doc.ref, { isDefault: false });
        }
      });
      await batch.commit();
    }

    // Update address
    const updateData = {
      ...addressData,
      updatedAt: new Date().toISOString(),
    };

    await db
      .collection('users')
      .doc(targetUid)
      .collection('shipping_addresses')
      .doc(id)
      .update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Indirizzo aggiornato con successo',
    });

  } catch (error: any) {
    console.error('Update address error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Errore nell\'aggiornamento dell\'indirizzo',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete shipping address
export async function DELETE(request: NextRequest) {
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

    // Get address ID from query params
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID indirizzo mancante' },
        { status: 400 }
      );
    }

    // Get target user ID (for admin access)
    const db = getAdminFirestore();
    const targetUid = userId || uid;

    // If userId is provided, verify user is admin
    if (userId && userId !== uid) {
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Non autorizzato' },
          { status: 403 }
        );
      }
    }

    // Delete address
    await db
      .collection('users')
      .doc(targetUid)
      .collection('shipping_addresses')
      .doc(id)
      .delete();

    return NextResponse.json({
      success: true,
      message: 'Indirizzo eliminato con successo',
    });

  } catch (error: any) {
    console.error('Delete address error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Errore nell\'eliminazione dell\'indirizzo',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
