'use client';

// Email verification page with token in URL path (compatible with Brevo tracking)
// URL: /verify-email/[token]

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function VerifyEmailTokenPage({ params }: { params: { token: string } }) {
  useEffect(() => {
    // Redirect to verify-email with token as query param
    // This way we reuse the existing verify-email page
    redirect(`/verify-email?token=${params.token}`);
  }, [params.token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Verifying your email...</p>
      </div>
    </div>
  );
}
