'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ReportBuilder from '@/components/reports/ReportBuilder';

export default function DocumentiPage() {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.push('/login');
    }
  }, [loading, firebaseUser, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check if user has clientCode assigned
  if (!user.clientCode) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-yellow-900 mb-2">
            Codice Cliente Non Configurato
          </h2>
          <p className="text-yellow-800">
            Il tuo account non ha ancora un codice cliente associato.
            Contatta l'amministratore per abilitare l'accesso ai documenti.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ReportBuilder
        reportSlug="customer_documents_summary"
        clientCode={user.clientCode}
        language="it"
      />
    </div>
  );
}
