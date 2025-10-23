// Debug API per verificare la logica delle gallery dinamiche
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
  const productCode = searchParams.get('code');

  try {
    // 1. Carica gallery config
    const configResponse = await fetch('https://shop.didieffeb2b.com/admin/api/get-gallery-config.php', {
      cache: 'no-store',
    });
    const galleryConfig = await configResponse.json();

    // 2. Carica prodotti
    const productsResponse = await fetch('https://shop.didieffeb2b.com/data/products.json', {
      cache: 'no-store',
    });
    const productsData = await productsResponse.json();
    const products = productsData.prodotti || [];

    // 3. Trova il prodotto corrente
    const currentProduct = products.find((p: any) => p.codice === productCode);

    if (!currentProduct) {
      return Response.json({
        error: 'Prodotto non trovato',
        productCode,
        totalProducts: products.length
      });
    }

    // 4. Analizza gli attributi configurati
    const debug: any = {
      productCode: currentProduct.codice,
      productName: currentProduct.nome,
      galleryConfig,
      attributiPresenti: Object.keys(currentProduct.attributi || {}),
      analisiGallery: []
    };

    if (galleryConfig.success && galleryConfig.galleryAttributes) {
      galleryConfig.galleryAttributes.forEach((configAttr: any) => {
        const attrName = configAttr.name;
        const currentAttr = currentProduct.attributi?.[attrName];

        const analisi: any = {
          attributeName: attrName,
          trovato: !!currentAttr,
        };

        if (currentAttr) {
          // Estrai il valore
          let attrValue: string;
          if (typeof currentAttr === 'object' && 'value' in currentAttr) {
            attrValue = currentAttr.value?.it || currentAttr.value;
          } else {
            attrValue = String(currentAttr);
          }

          analisi.valore = attrValue;
          analisi.struttura = currentAttr;

          // Filtra prodotti con stesso valore
          const filtered = products.filter((p: any) => {
            if (p.codice === currentProduct.codice) return false;

            const pAttr = p.attributi?.[attrName];
            if (!pAttr) return false;

            let pValue: string;
            if (typeof pAttr === 'object' && 'value' in pAttr) {
              pValue = pAttr.value?.it || pAttr.value;
            } else {
              pValue = String(pAttr);
            }

            return pValue === attrValue;
          });

          analisi.prodottiFiltrati = filtered.length;
          analisi.prodottiEsempio = filtered.slice(0, 3).map((p: any) => ({
            codice: p.codice,
            nome: p.nome
          }));
        }

        debug.analisiGallery.push(analisi);
      });
    }

    return Response.json(debug, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });

  } catch (error: any) {
    return Response.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
