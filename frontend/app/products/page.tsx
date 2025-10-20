// app/products/page.tsx - Catalogo prodotti completo
import { getAllProducts, getProductsMeta } from '@/lib/db/products';
import ProductCatalog from '@/components/ProductCatalog';

// Forza rendering dinamico per evitare errori con useSearchParams
export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const products = await getAllProducts();
  const meta = await getProductsMeta();

  const categories = meta?.categories || [];
  const filters = meta?.filters || [];

  // Normalizza i filtri - converti da struttura {field, options} a {key, values}
  // Ordina per campo "order" se presente
  const sortedFilters = [...filters].sort((a: any, b: any) => {
    const orderA = a.order ?? 999;
    const orderB = b.order ?? 999;
    return orderA - orderB;
  });

  const cleanFilters = sortedFilters
    .map(f => {
      if (typeof f !== 'object') return null;

      // Se ha già la struttura corretta {key, values}
      if ('key' in f && 'values' in f && Array.isArray(f.values)) {
        return {
          key: f.key,
          values: f.values,
          type: f.type || 'checkbox',
        };
      }

      // Gestione filtro range (prezzo)
      if (f.type === 'range' && 'field' in f && 'min' in f && 'max' in f) {
        return {
          key: String(f.field || f.label),
          values: [], // Range non usa values
          type: 'range',
          min: f.min,
          max: f.max,
        };
      }

      // Se ha struttura {field, options, type} dal backend CON TRADUZIONI
      if ('field' in f && 'options' in f) {
        // Le options ora sono oggetti con {label: {it, en, ...}, value: {it, en, ...}}
        // Manteniamo l'array completo per accedere alle traduzioni nel frontend
        return {
          key: String(f.field || f.label),
          values: [], // Non usiamo più values appiattiti
          options: f.options, // Mantieni opzioni complete con traduzioni
          type: f.type || 'checkbox',
        };
      }

      return null;
    })
    .filter((f): f is NonNullable<typeof f> => {
      if (!f) return false;
      return f.values.length > 0 || f.type === 'range' || !!f.options;
    });

  return (
    <div className="pt-16">
      <ProductCatalog
        products={products}
        categories={categories}
        filters={cleanFilters}
      />
    </div>
  );
}
