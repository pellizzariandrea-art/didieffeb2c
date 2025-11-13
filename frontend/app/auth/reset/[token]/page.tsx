'use client';

// Password reset page with token in URL path (compatible with Brevo tracking)
// URL: /auth/reset/[token]

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  useEffect(() => {
    // Redirect to setup-password with token as query param
    // This way we reuse the existing setup-password page
    redirect(`/auth/setup-password?token=${params.token}`);
  }, [params.token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Reindirizzamento...</p>
      </div>
    </div>
  );
}
