// app/wishlist/page.tsx
import { getCachedProducts } from '@/lib/server/products-cache';
import WishlistClient from './WishlistClient';

export default async function WishlistPage() {
  // Fetch all products server-side
  const productsData = await getCachedProducts();
  const allProducts = productsData.prodotti || [];

  return <WishlistClient allProducts={allProducts} />;
}
