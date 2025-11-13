'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ReportConfig } from '@/types/report';
import ReportBuilder from '@/components/reports/ReportBuilder';
import ComponentCustomizer from '@/components/reports/ComponentCustomizer';
import ReportErrorBoundary from '@/components/reports/ReportErrorBoundary';
import Link from 'next/link';
import { ArrowLeft, Eye, Palette } from 'lucide-react';

export default function ReportDetailPage() {
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;

  // Preview mode from URL params
  const isPreviewMode = searchParams?.get('preview') === 'true';
  const previewClientCode = searchParams?.get('clientCode') || '';

  const [reportConfig, setReportConfig] = useState<ReportConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCustomizer, setShowCustomizer] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push('/');
    }
  }, [authLoading, firebaseUser, router]);

  // Load report configuration and check authorization
  useEffect(() => {
    if (user && slug) {
      loadReportConfig();
    }
  }, [user, slug]);

  const loadReportConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/reports/config?slug=${slug}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Report non trovato');
        } else {
          setError('Errore nel caricamento del report');
        }
        return;
      }

      const data = await response.json();
      const config: ReportConfig = data.config;

      // Check if report is enabled
      if (config.enabled === false) {
        setError('Questo report non è attualmente disponibile');
        return;
      }

      // Check if user is authorized for this report (skip in preview mode)
      if (
        !isPreviewMode &&
        config.clientTypes &&
        config.clientTypes.length > 0 &&
        !config.clientTypes.includes(user!.role as 'b2b' | 'b2c')
      ) {
        setError('Non hai i permessi per accedere a questo report');
        return;
      }

      setReportConfig(config);
    } catch (err) {
      console.error('Error loading report config:', err);
      setError('Errore nel caricamento del report');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Determine which clientCode to use
  const effectiveClientCode = isPreviewMode ? previewClientCode : user.clientCode;

  // Check if user has clientCode assigned (skip in preview mode)
  if (!isPreviewMode && !user.clientCode) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/my-account/reports"
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna ai report
          </Link>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-yellow-900 mb-2">
            Codice Cliente Non Configurato
          </h2>
          <p className="text-yellow-800">
            Il tuo account non ha ancora un codice cliente associato. Contatta
            l'amministratore per abilitare l'accesso ai report.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/my-account/reports"
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna ai report
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 mb-2">Errore</h2>
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!reportConfig) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/my-account/reports"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna ai report
        </Link>
      </div>

      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Eye className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Modalità Anteprima
                </p>
                <p className="text-xs text-blue-700">
                  Stai visualizzando il report con dati del cliente: <code className="bg-blue-100 px-2 py-0.5 rounded font-mono">{previewClientCode}</code>
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCustomizer(true)}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 shadow-sm text-sm font-medium"
              title="Personalizza componenti UI con AI"
            >
              <Palette className="w-4 h-4 mr-2" />
              Personalizza UI
            </button>
          </div>
        </div>
      )}

      {/* Report Builder with Error Boundary */}
      <ReportErrorBoundary>
        <ReportBuilder
          reportSlug={slug}
          clientCode={effectiveClientCode || ''}
          language="it"
        />
      </ReportErrorBoundary>

      {/* Component Customizer Modal */}
      {isPreviewMode && (
        <ComponentCustomizer
          isOpen={showCustomizer}
          onClose={() => setShowCustomizer(false)}
        />
      )}
    </div>
  );
}
