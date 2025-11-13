'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Mail, CheckCircle, XCircle, Clock, RefreshCw, Loader2, AlertCircle } from 'lucide-react';

interface EmailLog {
  id: string;
  to: string;
  subject: string;
  status: 'success' | 'error' | 'pending';
  templateSlug?: string;
  messageId?: string;
  error?: string;
  brevoResponse?: any;
  createdAt: Date;
  sentAt?: Date;
}

export default function EmailLogsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadLogs();
    }
  }, [user]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/email-logs');
      const data = await response.json();

      if (data.success) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error('Error loading email logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.status === filter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Caricamento logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
              Log Email Inviate
            </h1>
            <p className="text-gray-600">
              Monitoraggio completo delle email inviate tramite Brevo
            </p>
          </div>
          <button
            onClick={loadLogs}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 font-medium"
          >
            <RefreshCw className="w-5 h-5" />
            Aggiorna
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-blue-900 uppercase">Totale</span>
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-4xl font-bold text-blue-900">{logs.length}</div>
          <div className="text-sm text-blue-700 mt-1">Email inviate</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-green-900 uppercase">Successo</span>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-4xl font-bold text-green-900">
            {logs.filter(l => l.status === 'success').length}
          </div>
          <div className="text-sm text-green-700 mt-1">
            {logs.length > 0 ? Math.round((logs.filter(l => l.status === 'success').length / logs.length) * 100) : 0}% tasso successo
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border-2 border-red-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-red-900 uppercase">Errori</span>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <div className="text-4xl font-bold text-red-900">
            {logs.filter(l => l.status === 'error').length}
          </div>
          <div className="text-sm text-red-700 mt-1">
            {logs.length > 0 ? Math.round((logs.filter(l => l.status === 'error').length / logs.length) * 100) : 0}% tasso errore
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Filtra per Stato</h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
            }`}
          >
            Tutte
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filter === 'all' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {logs.length}
            </span>
          </button>
          <button
            onClick={() => setFilter('success')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              filter === 'success'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
            }`}
          >
            Successo
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filter === 'success' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'
            }`}>
              {logs.filter(l => l.status === 'success').length}
            </span>
          </button>
          <button
            onClick={() => setFilter('error')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              filter === 'error'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/30'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
            }`}
          >
            Errori
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filter === 'error' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'
            }`}>
              {logs.filter(l => l.status === 'error').length}
            </span>
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Destinatario
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Oggetto
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Dettagli
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Nessun log trovato</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span className={`px-3 py-1.5 text-xs font-bold rounded-lg border-2 ${getStatusBadge(log.status)}`}>
                          {log.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900">
                      {log.to}
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-700 max-w-xs truncate">
                      {log.subject}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      {log.templateSlug ? (
                        <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg border border-blue-200">
                          {log.templateSlug}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600">
                      {new Date(log.createdAt).toLocaleString('it-IT')}
                    </td>
                    <td className="px-6 py-5 text-sm">
                      {log.status === 'success' && log.messageId && (
                        <div className="text-xs text-gray-600">
                          <div className="font-semibold mb-1">Message ID:</div>
                          <div className="font-mono text-xs bg-gray-50 px-2 py-1 rounded border border-gray-200 break-all max-w-xs">{log.messageId}</div>
                        </div>
                      )}
                      {log.status === 'error' && log.error && (
                        <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200 max-w-xs">
                          {log.error}
                        </div>
                      )}
                      {log.brevoResponse && (
                        <details className="text-xs text-gray-600 mt-2">
                          <summary className="cursor-pointer hover:text-blue-600 font-semibold">
                            📋 Risposta Brevo
                          </summary>
                          <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-xs overflow-auto max-w-md border border-gray-200">
                            {JSON.stringify(log.brevoResponse, null, 2)}
                          </pre>
                        </details>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
