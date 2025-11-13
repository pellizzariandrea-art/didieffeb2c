'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ReportConfig } from '@/types/report';
import { FileText, BarChart3, TrendingUp, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import uiLabels from '@/config/ui-labels.json';

type ReportWithSlug = ReportConfig & { slug: string };

export default function ReportsPage() {
  const { user, firebaseUser, loading } = useAuth();
  const { currentLang: language } = useLanguage();
  const router = useRouter();
  const [reports, setReports] = useState<ReportWithSlug[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const labels = uiLabels.account.reports;

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.push('/');
    }
  }, [loading, firebaseUser, router]);

  // Load available reports
  useEffect(() => {
    if (user) {
      loadAvailableReports();
    }
  }, [user]);

  const loadAvailableReports = async () => {
    try {
      setLoadingReports(true);
      const response = await fetch('/api/reports/config');
      const data = await response.json();

      // Convert object to array and filter based on user role
      const allReports: ReportWithSlug[] = Object.entries(data).map(
        ([slug, config]) => ({
          ...(config as ReportConfig),
          slug,
        })
      );

      // Filter reports based on:
      // 1. enabled !== false
      // 2. clientTypes includes user role OR clientTypes is empty/undefined (tutti)
      const availableReports = allReports.filter((report) => {
        if (report.enabled === false) return false;

        if (!report.clientTypes || report.clientTypes.length === 0) {
          return true; // Disponibile per tutti
        }

        return report.clientTypes.includes(user!.role as 'b2b' | 'b2c');
      });

      setReports(availableReports);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  if (loading || loadingReports) {
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
            Il tuo account non ha ancora un codice cliente associato. Contatta
            l'amministratore per abilitare l'accesso ai report.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/orders"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {labels.back_to_user_area[language]}
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">I Miei Report</h1>
        <p className="mt-2 text-gray-600">
          Visualizza report e statistiche del tuo account
        </p>
      </div>

      {/* Reports Grid */}
      {reports.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Nessun report disponibile
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Non ci sono report configurati per il tuo tipo di account
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Link
              key={report.slug}
              href={`/my-account/reports/${report.slug}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border border-gray-200 hover:border-blue-500"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                  {getReportIcon(report.slug)}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {report.title}
              </h3>

              {report.description && (
                <p className="text-sm text-gray-600 mb-4">{report.description}</p>
              )}

              <div className="flex items-center text-sm text-blue-600 font-medium">
                Visualizza report →
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-900">Informazioni</h3>
            <div className="mt-2 text-sm text-blue-800">
              <p>
                I report mostrano dati aggiornati dal database aziendale. Puoi
                applicare filtri, esportare i dati e visualizzare statistiche
                aggregate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getReportIcon(slug: string) {
  // Icon based on report type
  if (slug.includes('document')) {
    return <FileText className="w-6 h-6 text-white" />;
  }
  if (slug.includes('stat') || slug.includes('summary')) {
    return <BarChart3 className="w-6 h-6 text-white" />;
  }
  if (slug.includes('trend') || slug.includes('analysis')) {
    return <TrendingUp className="w-6 h-6 text-white" />;
  }
  return <FileText className="w-6 h-6 text-white" />;
}
