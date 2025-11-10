// api/users/list/route.ts
// API endpoint to get active users (for report preview)

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') as 'b2b' | 'b2c' | null;

    // Validate role parameter
    if (role && role !== 'b2b' && role !== 'b2c') {
      return NextResponse.json(
        { error: 'Invalid role parameter. Must be b2b or b2c' },
        { status: 400 }
      );
    }

    // Get Firestore instance
    const db = getAdminFirestore();

    // Build query
    let query = db.collection('users').where('status', '==', 'active');

    if (role) {
      query = query.where('role', '==', role);
    }

    // Execute query (without orderBy to avoid composite index requirement)
    const snapshot = await query.get();

    // Map results
    const simplifiedUsers = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        email: data.email,
        role: data.role,
        clientCode: data.clientCode || '',
        displayName:
          data.role === 'b2b'
            ? data.ragioneSociale
            : data.role === 'b2c'
            ? `${data.nome} ${data.cognome}`
            : data.email,
      };
    });

    return NextResponse.json({
      success: true,
      users: simplifiedUsers,
      count: simplifiedUsers.length,
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
