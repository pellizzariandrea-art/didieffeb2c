'use client';

// app/analytics/page.tsx - Analytics Dashboard
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAnalyticsStore } from '@/stores/analyticsStore';
import type { ProductStats, SearchStats, FilterStats } from '@/stores/analyticsStore';
import { TrendingUp, Search, Filter, ShoppingCart, Eye, Download, Trash2, ArrowLeft } from 'lucide-react';

export default function AnalyticsPage() {
  const {
    getTopProducts,
    getTopSearches,
    getTopFilters,
    getTotalViews,
    getTotalSearches,
    getTotalAddToCarts,
    getConversionRate,
    exportEvents,
    clearAllEvents,
  } = useAnalyticsStore();

  const [topProducts, setTopProducts] = useState<ProductStats[]>([]);
  const [topSearches, setTopSearches] = useState<SearchStats[]>([]);
  const [topFilters, setTopFilters] = useState<FilterStats[]>([]);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalSearches: 0,
    totalAddToCarts: 0,
    conversionRate: 0,
  });

  // Load analytics data on mount
  useEffect(() => {
    setTopProducts(getTopProducts(10));
    setTopSearches(getTopSearches(10));
    setTopFilters(getTopFilters(10));
    setStats({
      totalViews: getTotalViews(),
      totalSearches: getTotalSearches(),
      totalAddToCarts: getTotalAddToCarts(),
      conversionRate: getConversionRate(),
    });
  }, []);

  const handleExport = () => {
    const data = exportEvents();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('Sei sicuro di voler cancellare tutti i dati analytics? Questa azione non può essere annullata.')) {
      clearAllEvents();
      // Reload data
      setTopProducts(getTopProducts(10));
      setTopSearches(getTopSearches(10));
      setTopFilters(getTopFilters(10));
      setStats({
        totalViews: getTotalViews(),
        totalSearches: getTotalSearches(),
        totalAddToCarts: getTotalAddToCarts(),
        conversionRate: getConversionRate(),
      });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-sm text-gray-600 mt-1">Statistiche e metriche e-commerce</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Esporta JSON
              </button>
              <button
                onClick={handleClear}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                Cancella Dati
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Visualizzazioni Prodotti</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalViews}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Search className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Ricerche Totali</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalSearches}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Aggiunti al Carrello</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalAddToCarts}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Tasso di Conversione</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                Prodotti Più Visti
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prodotto</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Viste</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Carrello</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Conv%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topProducts.length > 0 ? (
                    topProducts.map((product, index) => (
                      <tr key={product.code} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/products/${product.code}`}
                            className="text-sm font-medium text-emerald-600 hover:text-emerald-800 hover:underline"
                          >
                            {product.name}
                          </Link>
                          <p className="text-xs text-gray-500 mt-1">{product.code}</p>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-900">{product.viewCount}</td>
                        <td className="px-6 py-4 text-center text-sm text-gray-900">{product.addToCartCount}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-sm font-semibold ${product.conversionRate > 20 ? 'text-green-600' : product.conversionRate > 10 ? 'text-orange-600' : 'text-gray-600'}`}>
                            {product.conversionRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                        Nessun dato disponibile
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Searches */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Search className="w-5 h-5 text-purple-600" />
                Ricerche Più Frequenti
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Query</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ricerche</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Risultati Media</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topSearches.length > 0 ? (
                    topSearches.map((search, index) => (
                      <tr key={`${search.query}-${index}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">{search.query}</span>
                          <p className="text-xs text-gray-500 mt-1">
                            Ultima ricerca: {formatDate(search.lastSearched)}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-900">{search.count}</td>
                        <td className="px-6 py-4 text-center text-sm text-gray-900">
                          {Math.round(search.avgResultsCount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                        Nessun dato disponibile
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Filters */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 lg:col-span-2">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Filter className="w-5 h-5 text-orange-600" />
                Filtri Più Usati
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filtro</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valore</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Utilizzi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ultimo Utilizzo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topFilters.length > 0 ? (
                    topFilters.map((filter, index) => (
                      <tr key={`${filter.key}-${filter.value}-${index}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <span className="font-medium">{filter.key}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{filter.value}</td>
                        <td className="px-6 py-4 text-center text-sm text-gray-900">{filter.count}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(filter.lastUsed)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                        Nessun dato disponibile
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
