// Debug API per verificare parsing filtri da URL
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // SECURITY: Disable debug endpoint in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not Found' },
      { status: 404 }
    );
  }

  const searchParams = request.nextUrl.searchParams;

  // Simula la logica di getFiltersFromURL
  const filters: Record<string, string[]> = {};
  const systemParams = ['q', 'category', 'view', 'sort', 'page'];

  // 1. Leggi parametri con prefisso f_
  const prefixedFilters: Record<string, string[]> = {};
  searchParams.forEach((value, key) => {
    if (key.startsWith('f_')) {
      const filterKey = key.substring(2);
      prefixedFilters[filterKey] = value.split(',');
    }
  });

  // 2. Leggi parametri diretti
  const directFilters: Record<string, string[]> = {};
  searchParams.forEach((value, key) => {
    if (!systemParams.includes(key) && !key.startsWith('f_')) {
      directFilters[key] = value.split(',');
    }
  });

  // 3. Decide quale usare
  const finalFilters = Object.keys(prefixedFilters).length > 0
    ? prefixedFilters
    : directFilters;

  // Carica i prodotti per testare il filtraggio
  let productsCount = 0;
  let filteredCount = 0;
  let sampleProducts: any[] = [];

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://shop.didieffeb2b.com';
    const productsResponse = await fetch(`${apiUrl}/data/products.json`, {
      cache: 'no-store',
    });
    const productsData = await productsResponse.json();
    const products = productsData.prodotti || [];
    productsCount = products.length;

    // Applica i filtri (simula logica ProductCatalog)
    let filtered = products;

    Object.entries(finalFilters).forEach(([filterKey, filterValues]) => {
      filtered = filtered.filter((product: any) => {
        const attr = product.attributi?.[filterKey];
        if (!attr) return false;

        let productValue: string;
        if (typeof attr === 'object' && 'value' in attr) {
          productValue = attr.value?.it || attr.value;
        } else {
          productValue = String(attr);
        }

        return filterValues.some(fv => {
          const normalized1 = String(productValue).trim().toLowerCase();
          const normalized2 = String(fv).trim().toLowerCase();
          return normalized1 === normalized2;
        });
      });
    });

    filteredCount = filtered.length;
    sampleProducts = filtered.slice(0, 5).map((p: any) => ({
      codice: p.codice,
      nome: p.nome?.it || p.nome,
      attributi: Object.keys(p.attributi || {}).reduce((acc: any, key) => {
        const attr = p.attributi[key];
        if (typeof attr === 'object' && 'value' in attr) {
          acc[key] = attr.value?.it || attr.value;
        } else {
          acc[key] = attr;
        }
        return acc;
      }, {})
    }));

  } catch (error: any) {
    console.error('Debug filters error:', error);
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 });
  }

  return Response.json({
    url: request.url,
    searchParams: Object.fromEntries(searchParams.entries()),
    parsing: {
      prefixedFilters,
      directFilters,
      finalFilters,
      usedFormat: Object.keys(prefixedFilters).length > 0 ? 'prefixed (f_*)' : 'direct'
    },
    filtering: {
      totalProducts: productsCount,
      filteredProducts: filteredCount,
      sampleProducts
    }
  }, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
