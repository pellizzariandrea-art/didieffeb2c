// Public settings API (no auth required)
// Returns logo and company info for public pages (auth, emails, etc.)

import { NextResponse } from 'next/server';
import { getAppSettingsServer } from '@/lib/firebase/settings-server';

export async function GET() {
  try {
    const settings = await getAppSettingsServer();

    // Return only public information (no sensitive data)
    return NextResponse.json({
      success: true,
      settings: {
        company: {
          name: settings.company.name,
          address: settings.company.address,
          city: settings.company.city,
          postalCode: settings.company.postalCode,
          province: settings.company.province,
          country: settings.company.country,
          website: settings.company.website,
          email: settings.company.email,
          phone: settings.company.phone,
          vatNumber: settings.company.vatNumber,
          taxCode: settings.company.taxCode,
        },
        logo: settings.logo ? {
          base64: settings.logo.base64,
          type: settings.logo.type,
        } : null,
        brevo: {
          senderEmail: settings.brevo.senderEmail,
          senderName: settings.brevo.senderName,
        },
      },
    });
  } catch (error: any) {
    console.error('[Settings Public API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load settings' },
      { status: 500 }
    );
  }
}
