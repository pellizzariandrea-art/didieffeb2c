// app/products/[code]/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Prodotto non trovato
        </h1>
        <p className="text-gray-600 mb-6">
          Il prodotto che stai cercando non esiste o non è disponibile.
        </p>
        <Link
          href="/"
          className="inline-block bg-gray-900 text-white py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Torna al catalogo
        </Link>
      </div>
    </div>
  );
}
