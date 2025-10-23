// lib/variant-config.ts
// Utility per leggere e gestire la configurazione delle gallery

export interface GalleryAttribute {
  name: string;
  dbColumn: string;
  isBoolean: boolean;
  transform: string;
}

export interface GalleryConfig {
  success: boolean;
  galleryAttributes: GalleryAttribute[];
  count: number;
}

let cachedConfig: GalleryConfig | null = null;
let cacheTime: number = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 ora (config cambia raramente)

/**
 * Fetches gallery configuration from API with caching
 * Returns max 2 attributes flagged for gallery generation
 */
export async function getGalleryConfig(): Promise<GalleryConfig | null> {
  // Check cache
  if (cachedConfig && Date.now() - cacheTime < CACHE_TTL) {
    return cachedConfig;
  }

  try {
    const response = await fetch('/api/get-variant-config', {
      cache: 'force-cache',
      next: { revalidate: 3600 } // Revalidate ogni ora
    });

    if (!response.ok) {
      console.error('Failed to fetch gallery config');
      return null;
    }

    const config = await response.json();

    // Update cache
    cachedConfig = config;
    cacheTime = Date.now();

    return config;
  } catch (error) {
    console.error('Error fetching gallery config:', error);
    return null;
  }
}
