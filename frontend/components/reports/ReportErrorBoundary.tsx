'use client';

import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export default class ReportErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Report component error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Notify parent if callback provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    // Reload page to get fresh component
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg border-2 border-red-300 overflow-hidden">
            {/* Header */}
            <div className="bg-red-600 text-white p-4 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Errore nel Componente Report</h2>
                <p className="text-sm text-red-100 mt-1">
                  Si è verificato un errore durante il rendering del componente
                </p>
              </div>
            </div>

            {/* Error Details */}
            <div className="p-6 space-y-4">
              {/* Error Message */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Messaggio Errore:
                </h3>
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <code className="text-sm text-red-900 break-all">
                    {this.state.error?.message || 'Unknown error'}
                  </code>
                </div>
              </div>

              {/* Stack Trace */}
              {this.state.error?.stack && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Stack Trace:
                  </h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3 max-h-64 overflow-y-auto">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </div>
              )}

              {/* Component Stack */}
              {this.state.errorInfo?.componentStack && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Component Stack:
                  </h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3 max-h-48 overflow-y-auto">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h3 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Cosa fare:
                </h3>
                <ul className="text-sm text-yellow-800 space-y-1 ml-6 list-disc">
                  <li>Apri il modal "🎨 Personalizza UI"</li>
                  <li>Carica e attiva una versione precedente funzionante</li>
                  <li>Oppure correggi l'errore nel codice e salva di nuovo</li>
                  <li>Se l'errore persiste, clicca "Ricarica Pagina" sotto</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={this.handleReset}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  Ricarica Pagina
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                >
                  Torna Indietro
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
