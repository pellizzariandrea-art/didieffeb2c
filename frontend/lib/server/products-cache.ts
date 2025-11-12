// lib/server/products-cache.ts
// Sistema di cache locale per products.json
// NOTA: Questo modulo è solo server-side (usa Node.js fs)

import 'server-only';
import fsSync from 'fs';
import path from 'path';
import { ProductsResponse } from '@/types/product';

const PRODUCTS_URL = `${process.env.NEXT_PUBLIC_API_URL || 'https://shop.didieffeb2b.com'}/data/products.json`;
const CACHE_DIR = path.join(process.cwd(), 'data');
const CACHE_FILE = path.join(CACHE_DIR, 'products-cache.json');
const CACHE_META_FILE = path.join(CACHE_DIR, 'products-cache-meta.json');
const CACHE_TTL = 15 * 60 * 1000; // 15 minuti in millisecondi

interface CacheMeta {
  lastUpdate: number;
  expiresAt: number;
}

/**
 * Assicura che la directory cache esista
 */
function ensureCacheDir() {
  if (!fsSync.existsSync(CACHE_DIR)) {
    fsSync.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Legge i metadati della cache
 */
function getCacheMeta(): CacheMeta | null {
  try {
    if (!fsSync.existsSync(CACHE_META_FILE)) {
      return null;
    }
    const content = fsSync.readFileSync(CACHE_META_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading cache meta:', error);
    return null;
  }
}

/**
 * Salva i metadati della cache
 */
function saveCacheMeta(meta: CacheMeta) {
  try {
    ensureCacheDir();
    fsSync.writeFileSync(CACHE_META_FILE, JSON.stringify(meta, null, 2));
  } catch (error) {
    console.error('Error saving cache meta:', error);
  }
}

/**
 * Verifica se la cache è valida
 */
function isCacheValid(): boolean {
  const meta = getCacheMeta();
  if (!meta) return false;

  const now = Date.now();
  return now < meta.expiresAt && fsSync.existsSync(CACHE_FILE);
}

/**
 * Legge i dati dalla cache locale
 */
function readFromCache(): ProductsResponse | null {
  try {
    if (!fsSync.existsSync(CACHE_FILE)) {
      return null;
    }
    const content = fsSync.readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading cache file:', error);
    return null;
  }
}

/**
 * Scarica i dati dal server remoto e li salva in cache
 */
async function downloadAndCache(): Promise<ProductsResponse | null> {
  try {
    console.log('[Cache] Downloading products from remote server...');
    // Add cache-busting timestamp to avoid CDN/HTTP cache
    const cacheBustUrl = `${PRODUCTS_URL}?_t=${Date.now()}`;
    const response = await fetch(cacheBustUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ProductsResponse = await response.json();

    // Salva in cache
    ensureCacheDir();
    fsSync.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));

    // Aggiorna metadati
    const now = Date.now();
    saveCacheMeta({
      lastUpdate: now,
      expiresAt: now + CACHE_TTL,
    });

    console.log('[Cache] Products cached successfully');
    return data;
  } catch (error) {
    console.error('[Cache] Error downloading products:', error);
    return null;
  }
}

/**
 * Ottiene i prodotti con sistema di cache locale
 */
export async function getCachedProducts(): Promise<ProductsResponse> {
  // Se siamo su Vercel (processo.env.VERCEL), scarica direttamente senza cache filesystem
  const isVercel = process.env.VERCEL === '1';

  if (isVercel) {
    console.log('[Cache] Running on Vercel, downloading directly without filesystem cache...');
    try {
      // Add cache-busting timestamp to avoid CDN/HTTP cache
      const cacheBustUrl = `${PRODUCTS_URL}?_t=${Date.now()}`;
      const response = await fetch(cacheBustUrl, {
        next: { revalidate: 900 }, // Cache Next.js per 15 minuti
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ProductsResponse = await response.json();
      console.log(`[Cache] Downloaded ${data.total || data.prodotti?.length || 0} products from remote`);
      return data;
    } catch (error) {
      console.error('[Cache] Error downloading products on Vercel:', error);
      // Ritorna dati vuoti se il download fallisce
      return {
        prodotti: [],
        generated_at: new Date().toISOString(),
        total: 0
      };
    }
  }

  // Logica normale per ambiente locale con filesystem
  // Verifica se la cache è valida
  if (isCacheValid()) {
    console.log('[Cache] Using cached products');
    const cached = readFromCache();
    if (cached) {
      return cached;
    }
  }

  // Cache scaduta o non valida, scarica nuovi dati
  console.log('[Cache] Cache expired or invalid, downloading...');
  const freshData = await downloadAndCache();

  if (freshData) {
    return freshData;
  }

  // Fallback: usa cache anche se scaduta (meglio di niente)
  console.log('[Cache] Download failed, using stale cache as fallback');
  const staleCache = readFromCache();
  if (staleCache) {
    return staleCache;
  }

  // Ultimo fallback: restituisci struttura vuota
  console.error('[Cache] No cache available, returning empty data');
  return {
    prodotti: [],
    generated_at: new Date().toISOString(),
    total: 0
  };
}

/**
 * Forza l'aggiornamento della cache (utile per webhook o admin panel)
 */
export async function refreshCache(): Promise<boolean> {
  console.log('[Cache] Force refresh requested');
  const data = await downloadAndCache();
  return data !== null;
}

/**
 * Ottiene informazioni sullo stato della cache
 */
export function getCacheInfo() {
  const meta = getCacheMeta();
  const exists = fsSync.existsSync(CACHE_FILE);

  if (!meta || !exists) {
    return {
      exists: false,
      valid: false,
      lastUpdate: null,
      expiresAt: null,
      size: 0,
    };
  }

  const stats = fsSync.statSync(CACHE_FILE);
  const now = Date.now();

  return {
    exists: true,
    valid: now < meta.expiresAt,
    lastUpdate: new Date(meta.lastUpdate).toISOString(),
    expiresAt: new Date(meta.expiresAt).toISOString(),
    size: stats.size,
    sizeKB: Math.round(stats.size / 1024),
    sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
  };
}
