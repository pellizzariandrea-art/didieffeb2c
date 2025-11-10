'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Carica l'intero editor solo lato client
const ReportJsonEditor = dynamic(() => import('./ReportJsonEditor'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
        <p className="text-white">Caricamento editor...</p>
      </div>
    </div>
  ),
});

export default ReportJsonEditor;
