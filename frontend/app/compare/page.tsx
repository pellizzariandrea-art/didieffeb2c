// app/compare/page.tsx
import { getAllProducts } from '@/lib/db/products';
import CompareClient from './CompareClient';

export default async function ComparePage() {
  // Carica i prodotti server-side per evitare CORS
  const allProducts = await getAllProducts();

  return <CompareClient allProducts={allProducts} />;
}
