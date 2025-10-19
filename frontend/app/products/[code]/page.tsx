// app/products/[code]/page.tsx
import { notFound } from 'next/navigation';
import { getProductByCode, getAllProducts } from '@/lib/db/products';
import ProductDetail from '@/components/ProductDetail';

interface ProductPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { code } = await params;
  const product = await getProductByCode(code);

  if (!product) {
    notFound();
  }

  // Recupera TUTTI i prodotti per avere accesso alle traduzioni dei valori degli attributi
  // (le traduzioni per colori, materiali, ecc. sono sparse nei vari prodotti del catalogo)
  const allProducts = await getAllProducts();

  return <ProductDetail product={product} groupProducts={allProducts} />;
}
