'use client';

// app/compare/CompareClient.tsx
import { useCompare } from '@/contexts/CompareContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLabel } from '@/lib/ui-labels';
import { getTranslatedValue, formatAttributeValue } from '@/lib/product-utils';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Product } from '@/types/product';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Clipboard } from 'lucide-react';
import CartIcon from '@/components/CartIcon';
import WishlistIcon from '@/components/WishlistIcon';

interface CompareClientProps {
  allProducts: Product[];
}

export default function CompareClient({ allProducts }: CompareClientProps) {
  const { compareProducts, removeFromCompare, clearCompare } = useCompare();
  const { currentLang } = useLanguage();
  const router = useRouter();
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filtra i prodotti/varianti da confrontare
  const products = useMemo(() => {
    const result: Product[] = [];

    compareProducts.forEach(code => {
      // Prima cerca se è un prodotto master
      const masterProduct = allProducts.find(p => p.codice === code);
      if (masterProduct) {
        result.push(masterProduct);
        return;
      }

      // Altrimenti cerca se è una variante
      for (const product of allProducts) {
        if (product.variants) {
          const variant = product.variants.find(v => v.codice === code);
          if (variant) {
            // Crea un "pseudo-prodotto" dalla variante
            // Usa gli attributi della variante ma mantiene nome e immagine dal master
            result.push({
              ...product,
              codice: variant.codice,
              prezzo: variant.prezzo !== undefined ? variant.prezzo : product.prezzo,
              attributi: variant.attributi || product.attributi,
              immagine: variant.immagine || product.immagine,
            });
            break;
          }
        }
      }
    });

    return result;
  }, [allProducts, compareProducts]);

  // Redirect se non ci sono prodotti da confrontare
  useEffect(() => {
    if (compareProducts.length === 0) {
      router.push('/');
    }
  }, [compareProducts.length, router]);

  // Raccogli tutti gli attributi unici
  const allAttributes = useMemo(() => {
    const attrs = new Set<string>();
    products.forEach(product => {
      if (product.attributi) {
        Object.keys(product.attributi).forEach(attr => attrs.add(attr));
      }
    });
    return Array.from(attrs);
  }, [products]);

  // Funzione per ottenere la label tradotta di un attributo
  const getAttributeLabel = (attrKey: string): string => {
    // Cerca il primo prodotto che ha questo attributo con una label
    for (const product of products) {
      const attrValue = product.attributi?.[attrKey];
      if (attrValue && typeof attrValue === 'object' && attrValue !== null && 'label' in attrValue) {
        return getTranslatedValue(attrValue.label, currentLang);
      }
    }
    // Fallback: usa la chiave dell'attributo
    return attrKey;
  };

  // Funzione per verificare se un attributo ha valori diversi tra i prodotti
  const hasDifferentValues = (attr: string): boolean => {
    const values = products.map(p => {
      const val = p.attributi?.[attr];
      return formatAttributeValue(val, currentLang);
    });
    const uniqueValues = new Set(values);
    return uniqueValues.size > 1;
  };

  // Filtra attributi se "mostra solo differenze" è attivo
  const displayAttributes = useMemo(() => {
    return showOnlyDifferences
      ? allAttributes.filter(attr => hasDifferentValues(attr))
      : allAttributes;
  }, [allAttributes, showOnlyDifferences, products, currentLang]);

  if (products.length === 0) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clipboard className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {getLabel('compare.title', currentLang)}
                  </h1>
                  {products.length > 0 && (
                    <p className="text-sm text-gray-600">
                      {products.length} {products.length === 1 ? getLabel('compare.product', currentLang) : getLabel('compare.products', currentLang)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <WishlistIcon />
              <CartIcon />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
              {/* Toggle solo differenze */}
              <label className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyDifferences}
                  onChange={(e) => setShowOnlyDifferences(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">
                  <span className="hidden sm:inline">{getLabel('compare.differences_only', currentLang)}</span>
                  <span className="sm:hidden">{getLabel('compare.differences_only_short', currentLang)}</span>
                </span>
              </label>

              {/* Svuota confronto */}
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm font-medium"
              >
                <span className="hidden xs:inline">{getLabel('compare.clear_all', currentLang)}</span>
                <span className="xs:hidden">{getLabel('compare.clear_all_short', currentLang)}</span>
              </button>
            </div>
          </div>
        </div>

      {/* Tabella di confronto */}
      <main className="container mx-auto px-4 py-8">
        {/* Desktop Table View - hidden on mobile */}
        <div className="hidden md:block bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 w-48 sticky left-0 bg-gray-100 z-10">
                    {getLabel('compare.characteristic', currentLang)}
                  </th>
                  {products.map((product) => (
                    <th key={product.codice} className="px-4 py-3 min-w-[250px]">
                      <div className="text-center">
                        {/* Immagine */}
                        <div className="relative w-32 h-32 mx-auto mb-3 bg-gray-50 rounded-lg">
                          <Image
                            src={product.immagine || '/placeholder.svg'}
                            alt={getTranslatedValue(product.nome, currentLang)}
                            fill
                            className="object-contain p-2"
                            sizes="128px"
                          />
                        </div>
                        {/* Nome */}
                        <Link
                          href={`/products/${product.codice}`}
                          className="font-bold text-gray-900 hover:text-blue-600 transition-colors block mb-2"
                        >
                          {getTranslatedValue(product.nome, currentLang)}
                        </Link>
                        {/* Codice */}
                        <p className="text-xs font-mono text-gray-500 mb-3">{product.codice}</p>
                        {/* Rimuovi */}
                        <button
                          onClick={() => removeFromCompare(product.codice)}
                          className="text-xs text-red-600 hover:text-red-800 transition-colors"
                        >
                          × {getLabel('compare.remove_short', currentLang)}
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Prezzo */}
                <tr className="border-b border-gray-200 bg-blue-50">
                  <td className="px-4 py-3 font-bold text-gray-900 sticky left-0 bg-blue-50 z-10">
                    {getLabel('home.price_label', currentLang)}
                  </td>
                  {products.map((product) => (
                    <td key={product.codice} className="px-4 py-3 text-center">
                      <span className="text-2xl font-bold text-blue-600">
                        €{product.prezzo.toFixed(2).replace('.', ',')}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Attributi */}
                {displayAttributes.map((attr, idx) => {
                  const isDifferent = hasDifferentValues(attr);
                  return (
                    <tr
                      key={attr}
                      className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isDifferent ? 'bg-yellow-50' : ''}`}
                    >
                      <td className={`px-4 py-3 font-semibold text-gray-700 sticky left-0 z-10 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isDifferent ? 'bg-yellow-50' : ''}`}>
                        {getAttributeLabel(attr)}
                        {isDifferent && (
                          <span className="ml-2 text-xs text-yellow-600">⚠</span>
                        )}
                      </td>
                      {products.map((product) => {
                        const value = product.attributi?.[attr];
                        const formattedValue = formatAttributeValue(value, currentLang);

                        // Determina se è un valore booleano
                        let isBoolean = false;
                        let booleanValue = false;

                        if (typeof value === 'boolean') {
                          isBoolean = true;
                          booleanValue = value;
                        } else if (typeof value === 'object' && value !== null && 'value' in value) {
                          const rawValue = value.value;
                          if (typeof rawValue === 'boolean') {
                            isBoolean = true;
                            booleanValue = rawValue;
                          }
                        }

                        return (
                          <td key={product.codice} className="px-4 py-3 text-center">
                            {isBoolean ? (
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm font-bold ${
                                booleanValue
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                  : 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700'
                              }`}>
                                {booleanValue ? '✓' : '✗'} {booleanValue ? getLabel('common.yes', currentLang) : getLabel('common.no', currentLang)}
                              </span>
                            ) : (
                              <span className="text-gray-900">{formattedValue || '-'}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Compact Table - shown only on mobile */}
        <div className="md:hidden bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-2 py-2 text-left font-bold text-gray-700 w-24 sticky left-0 bg-gray-100 z-20 text-[10px] leading-tight">
                    Prodotto
                  </th>
                  {products.map((product) => (
                    <th key={product.codice} className="px-2 py-2 min-w-[110px] max-w-[110px]">
                      <div className="flex flex-col items-center gap-1">
                        {/* Immagine mini */}
                        <div className="relative w-16 h-16 bg-gray-50 rounded">
                          <Image
                            src={product.immagine || '/placeholder.svg'}
                            alt={getTranslatedValue(product.nome, currentLang)}
                            fill
                            className="object-contain p-1"
                            sizes="64px"
                          />
                        </div>
                        {/* Nome prodotto */}
                        <Link
                          href={`/products/${product.codice}`}
                          className="font-bold text-[10px] text-gray-900 hover:text-blue-600 transition-colors text-center line-clamp-2 leading-tight"
                        >
                          {getTranslatedValue(product.nome, currentLang)}
                        </Link>
                        {/* Codice */}
                        <p className="text-[9px] font-mono text-gray-500">{product.codice}</p>
                        {/* Rimuovi */}
                        <button
                          onClick={() => removeFromCompare(product.codice)}
                          className="text-[10px] text-red-600 hover:text-red-800 font-medium"
                        >
                          × {getLabel('compare.remove_short', currentLang)}
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Prezzo */}
                <tr className="border-b border-gray-200 bg-blue-50">
                  <td className="px-2 py-2 font-bold text-gray-900 sticky left-0 bg-blue-50 z-10 text-[10px]">
                    {getLabel('home.price_label', currentLang)}
                  </td>
                  {products.map((product) => (
                    <td key={product.codice} className="px-2 py-2 text-center">
                      <span className="text-sm font-bold text-blue-600 block">
                        €{product.prezzo.toFixed(2).replace('.', ',')}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Attributi */}
                {displayAttributes.map((attr, idx) => {
                  const isDifferent = hasDifferentValues(attr);
                  return (
                    <tr
                      key={attr}
                      className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isDifferent ? 'bg-yellow-50' : ''}`}
                    >
                      <td className={`px-2 py-2 font-bold text-gray-700 sticky left-0 z-10 text-[10px] leading-tight ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isDifferent ? 'bg-yellow-50' : ''}`}>
                        <div className="flex flex-col gap-0.5">
                          <span className="line-clamp-2">{getAttributeLabel(attr)}</span>
                          {isDifferent && (
                            <span className="text-[9px] bg-yellow-500 text-white px-1.5 py-0.5 rounded-full font-bold inline-block w-fit">
                              ⚠
                            </span>
                          )}
                        </div>
                      </td>
                      {products.map((product) => {
                        const value = product.attributi?.[attr];
                        const formattedValue = formatAttributeValue(value, currentLang);

                        // Determina se è un valore booleano
                        let isBoolean = false;
                        let booleanValue = false;

                        if (typeof value === 'boolean') {
                          isBoolean = true;
                          booleanValue = value;
                        } else if (typeof value === 'object' && value !== null && 'value' in value) {
                          const rawValue = value.value;
                          if (typeof rawValue === 'boolean') {
                            isBoolean = true;
                            booleanValue = rawValue;
                          }
                        }

                        return (
                          <td key={product.codice} className="px-2 py-2 text-center align-middle">
                            {isBoolean ? (
                              <span className={`inline-flex items-center gap-0.5 px-2 py-1 rounded text-[10px] font-bold ${
                                booleanValue
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                  : 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700'
                              }`}>
                                {booleanValue ? '✓' : '✗'}
                              </span>
                            ) : (
                              <span className="text-[11px] text-gray-900 font-medium block leading-tight break-words px-1">
                                {formattedValue || '-'}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legenda */}
        {showOnlyDifferences && displayAttributes.length === 0 && (
          <div className="mt-6 p-4 sm:p-6 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-sm sm:text-base text-green-800 font-semibold">
              ✓ Tutti i prodotti hanno le stesse caratteristiche
            </p>
          </div>
        )}
      </main>

      {/* Modal conferma svuota confronto */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {currentLang === 'it' && 'Svuotare il confronto?'}
                  {currentLang === 'en' && 'Clear comparison?'}
                  {currentLang === 'de' && 'Vergleich löschen?'}
                  {currentLang === 'fr' && 'Effacer la comparaison?'}
                  {currentLang === 'es' && '¿Borrar comparación?'}
                  {currentLang === 'pt' && 'Limpar comparação?'}
                </h3>
                <p className="text-sm text-gray-600">
                  {currentLang === 'it' && 'Tutti i prodotti verranno rimossi dal confronto. Questa azione non può essere annullata.'}
                  {currentLang === 'en' && 'All products will be removed from comparison. This action cannot be undone.'}
                  {currentLang === 'de' && 'Alle Produkte werden aus dem Vergleich entfernt. Diese Aktion kann nicht rückgängig gemacht werden.'}
                  {currentLang === 'fr' && 'Tous les produits seront supprimés de la comparaison. Cette action ne peut pas être annulée.'}
                  {currentLang === 'es' && 'Todos los productos serán eliminados de la comparación. Esta acción no se puede deshacer.'}
                  {currentLang === 'pt' && 'Todos os produtos serão removidos da comparação. Esta ação não pode ser desfeita.'}
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                {currentLang === 'it' && 'Annulla'}
                {currentLang === 'en' && 'Cancel'}
                {currentLang === 'de' && 'Abbrechen'}
                {currentLang === 'fr' && 'Annuler'}
                {currentLang === 'es' && 'Cancelar'}
                {currentLang === 'pt' && 'Cancelar'}
              </button>
              <button
                onClick={() => {
                  clearCompare();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                {currentLang === 'it' && 'Svuota'}
                {currentLang === 'en' && 'Clear'}
                {currentLang === 'de' && 'Löschen'}
                {currentLang === 'fr' && 'Effacer'}
                {currentLang === 'es' && 'Borrar'}
                {currentLang === 'pt' && 'Limpar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
