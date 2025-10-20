import { NextResponse } from 'next/server';
import { getAllProducts, formatAttributeValue } from '@/lib/db/products';

export const dynamic = 'force-dynamic';

interface CategoryData {
  name: string;
  productCount: number;
  image: string;
  link: string;
}

interface HomePageData {
  categoriesBySerie: CategoryData[];
  categoriesByLinea: CategoryData[];
  categoriesByApplicazione: CategoryData[];
  featuredProducts: any[];
}

export async function GET() {
  try {
    const products = await getAllProducts();

    if (!products || products.length === 0) {
      return NextResponse.json({
        categoriesBySerie: [],
        categoriesByLinea: [],
        categoriesByApplicazione: [],
        featuredProducts: [],
      });
    }

    // 1. CATEGORIE PER SERIE
    const serieMap = new Map<string, any[]>();
    products.forEach((product) => {
      const serie = product.attributi?.Serie;
      if (serie) {
        // Usa formatAttributeValue per gestire correttamente gli oggetti multilingua
        const serieValue = formatAttributeValue(serie, 'it');

        // Solo se il valore è valido e non vuoto
        if (serieValue && serieValue.trim() && !serieValue.includes('[object')) {
          if (!serieMap.has(serieValue)) {
            serieMap.set(serieValue, []);
          }
          serieMap.get(serieValue)!.push(product);
        }
      }
    });

    const categoriesBySerie: CategoryData[] = Array.from(serieMap.entries())
      .map(([serieName, serieProducts], index) => {
        // Prendi immagine dal primo prodotto con immagine (più affidabile)
        const productsWithImages = serieProducts.filter(p => p.immagine);
        // Usa index per variare la selezione invece di random puro
        const imageIndex = index % productsWithImages.length;
        const selectedProduct = productsWithImages.length > 0
          ? productsWithImages[imageIndex]
          : serieProducts[0];

        return {
          name: `Serie ${serieName}`,
          productCount: serieProducts.length,
          image: selectedProduct?.immagine || '/placeholder.svg',
          link: `/products?f_Serie=${encodeURIComponent(serieName)}`,
        };
      })
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, 6); // Top 6 serie

    // 2. CATEGORIE PER LINEA (basate su Tipologia)
    const lineaMap = new Map<string, any[]>();
    products.forEach((product) => {
      const tipologia = product.attributi?.Tipologia;
      if (tipologia) {
        const tipologiaValue = formatAttributeValue(tipologia, 'it');

        if (tipologiaValue && tipologiaValue.trim() && !tipologiaValue.includes('[object')) {
          if (!lineaMap.has(tipologiaValue)) {
            lineaMap.set(tipologiaValue, []);
          }
          lineaMap.get(tipologiaValue)!.push(product);
        }
      }
    });

    const categoriesByLinea: CategoryData[] = Array.from(lineaMap.entries())
      .map(([lineaName, lineaProducts], index) => {
        const productsWithImages = lineaProducts.filter(p => p.immagine);
        const imageIndex = index % productsWithImages.length;
        const selectedProduct = productsWithImages.length > 0
          ? productsWithImages[imageIndex]
          : lineaProducts[0];

        return {
          name: lineaName,
          productCount: lineaProducts.length,
          image: selectedProduct?.immagine || '/placeholder.svg',
          link: `/products?f_Tipologia=${encodeURIComponent(lineaName)}`,
        };
      })
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, 6); // Top 6 linee

    // 3. CATEGORIE PER APPLICAZIONE
    const applicazioniKeys = [
      'Applicazione su Legno',
      'Applicazione su Alluminio',
      'Applicazione su Pvc',
      'Scuri alla Veneta',
      'Persiane a Muro',
      'Persiane con Telaio',
    ];

    const categoriesByApplicazione: CategoryData[] = applicazioniKeys
      .map((appKey, index) => {
        const appProducts = products.filter((product) => {
          const appValue = product.attributi?.[appKey];
          if (!appValue) return false;

          const value = formatAttributeValue(appValue, 'it');
          return value && (value.toLowerCase() === 'si' || value.toLowerCase() === 'yes' || value === '1');
        });

        if (appProducts.length === 0) return null;

        const productsWithImages = appProducts.filter(p => p.immagine);
        const imageIndex = index % productsWithImages.length;
        const selectedProduct = productsWithImages.length > 0
          ? productsWithImages[imageIndex]
          : appProducts[0];

        return {
          name: appKey,
          productCount: appProducts.length,
          image: selectedProduct?.immagine || '/placeholder.svg',
          link: `/products?f_${encodeURIComponent(appKey)}=si`,
        };
      })
      .filter((cat): cat is CategoryData => cat !== null)
      .slice(0, 6);

    // 4. PRODOTTI IN EVIDENZA (random selection)
    const productsWithImages = products.filter(p => p.immagine);
    const shuffled = [...productsWithImages].sort(() => 0.5 - Math.random());
    const featuredProducts = shuffled.slice(0, 8);

    const homePageData: HomePageData = {
      categoriesBySerie,
      categoriesByLinea,
      categoriesByApplicazione,
      featuredProducts,
    };

    return NextResponse.json(homePageData);
  } catch (error) {
    console.error('Homepage generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate homepage data' },
      { status: 500 }
    );
  }
}
