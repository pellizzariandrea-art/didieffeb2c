// lib/db/products.ts
// Funzioni per recuperare prodotti dal JSON

import { Product, ProductsResponse } from '@/types/product';
import { getTranslatedValue, formatAttributeValue } from '@/lib/product-utils';

// Re-export utility functions
export { getTranslatedValue, formatAttributeValue };

/**
 * Recupera tutti i prodotti dal JSON usando cache locale
 * NOTA: Questa funzione è solo server-side
 */
export async function getAllProducts(): Promise<Product[]> {
  try {
    // Import dal modulo server-only
    const { getCachedProducts } = await import('../server/products-cache');
    const data = await getCachedProducts();
    return data.prodotti || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Recupera un singolo prodotto per codice
 * Se il codice corrisponde a una variante, crea un prodotto virtuale con quella variante come principale
 */
export async function getProductByCode(code: string): Promise<Product | null> {
  const products = await getAllProducts();

  // Cerca prima il prodotto diretto
  const directProduct = products.find(p => p.codice === code);
  if (directProduct) {
    return directProduct;
  }

  // Se non trovato, cerca nelle varianti di tutti i prodotti
  for (const product of products) {
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find(v => v.codice === code);
      if (variant) {
        // Crea un prodotto virtuale basato sulla variante
        return {
          ...product,
          codice: variant.codice,
          prezzo: variant.prezzo,
          immagine: variant.immagine || product.immagine,
          immagini: variant.immagini || product.immagini,
          attributi: {
            ...product.attributi,
            ...variant.attributi,
          },
        };
      }
    }
  }

  return null;
}

/**
 * Genera metadati dinamicamente analizzando i prodotti
 */
function generateMetaFromProducts(products: Product[]) {
  // Estrai lingue dai campi tradotti
  const languages = new Set<string>(['it']);

  // Estrai filtri dagli attributi comuni
  const filterValues: Record<string, Set<string>> = {};

  // Estrai categorie (se c'è un attributo "Categoria" o "Tipologia")
  const categories = new Set<string>();

  products.forEach(product => {
    // Analizza campi multilingua per estrarre lingue
    if (typeof product.nome === 'object') {
      Object.keys(product.nome).forEach(lang => languages.add(lang));
    }
    if (product.descrizione && typeof product.descrizione === 'object') {
      Object.keys(product.descrizione).forEach(lang => languages.add(lang));
    }

    // Analizza attributi per creare filtri
    if (product.attributi) {
      Object.entries(product.attributi).forEach(([key, value]) => {
        // Salta attributi che non sono utili per filtrare
        const skipKeys = ['EAN', 'Confezione da Pezzi', 'Specifiche tecniche'];
        if (skipKeys.includes(key)) return;

        if (!filterValues[key]) {
          filterValues[key] = new Set<string>();
        }

        // Estrai il valore usando la funzione helper
        const strValue = formatAttributeValue(value, 'it');

        // Aggiungi solo se il valore è valido e non è "[object Object]"
        if (strValue && strValue.trim() && !strValue.includes('[object')) {
          const cleanValue = strValue.trim();
          filterValues[key].add(cleanValue);

          // Se c'è "Tipologia" o "Categoria", aggiungi alle categorie
          if (key === 'Tipologia' || key === 'Categoria') {
            categories.add(cleanValue);
          }
        }
      });
    }
  });

  // Converti Set in array e crea struttura _meta
  const filters: Array<{ key: string; values: string[] }> = [];
  Object.entries(filterValues).forEach(([key, valueSet]) => {
    filters.push({
      key,
      values: Array.from(valueSet).sort(),
    });
  });

  return {
    languages: Array.from(languages),
    filters,
    categories: Array.from(categories).filter(c => typeof c === 'string' && c.trim()).sort(),
  };
}

/**
 * Recupera metadati (lingue, filtri, categorie)
 * Usa il _meta dal backend se disponibile, altrimenti genera dinamicamente
 * NOTA: Questa funzione è solo server-side
 */
export async function getProductsMeta() {
  try {
    // Import dal modulo server-only
    const { getCachedProducts } = await import('../server/products-cache');
    const data = await getCachedProducts();
    const products = data.prodotti || [];

    // Se c'è _meta dal backend, usalo come base
    if (data._meta) {
      const meta = { ...data._meta };

      // Se ci sono filtri nel _meta, restituiscili COSÌ COME SONO
      // Il backend ha già generato la struttura completa con traduzioni
      // NON sovrascrivere le options multilingua!
      if (meta.filters && Array.isArray(meta.filters)) {
        // Mantieni i filtri del backend senza modifiche
        // La struttura è già completa: {field, label, type, order, options: [{label: {it, en, ...}, value: {it, en, ...}}]}
      }

      // Se ci sono categorie nel _meta, arricchiscile
      if (meta.categories && Array.isArray(meta.categories)) {
        // Le categorie dal backend hanno già configurazione completa
        // Potremmo aggiungere qui conteggi aggiornati se necessario
      }

      return meta;
    }

    // Fallback: se non c'è _meta, genera dinamicamente dai prodotti
    return generateMetaFromProducts(products);
  } catch (error) {
    console.error('Error fetching products meta:', error);
    return null;
  }
}
