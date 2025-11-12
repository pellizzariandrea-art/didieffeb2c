// lib/firebase/settings-server.ts
// Firestore operations for application settings (Server-side using Admin SDK)

import { getAdminFirestore } from './admin';
import { AppSettings, DEFAULT_SETTINGS } from '@/types/settings';

const SETTINGS_DOC_ID = 'app-settings';
const SETTINGS_COLLECTION = 'settings';

// Cache for settings
let settingsCache: AppSettings | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get application settings from Firestore (server-side)
 * @param useCache - Whether to use cached settings (default: true)
 * @returns Application settings or default if not found
 */
export async function getAppSettingsServer(useCache: boolean = true): Promise<AppSettings> {
  // Return cached settings if still valid
  if (useCache && settingsCache && Date.now() - cacheTime < CACHE_DURATION) {
    console.log('[Settings Server] Using cached settings');
    return settingsCache;
  }

  try {
    console.log('[Settings Server] Loading from Firestore...');

    const db = getAdminFirestore();
    const docRef = db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const settings = docSnap.data() as AppSettings;
      console.log('[Settings Server] Loaded successfully');

      // Update cache
      settingsCache = settings;
      cacheTime = Date.now();

      return settings;
    } else {
      console.log('[Settings Server] No settings found, returning defaults');
      return DEFAULT_SETTINGS;
    }
  } catch (error) {
    console.error('[Settings Server] Error loading settings, using defaults:', error);
    // Return defaults instead of throwing error
    return DEFAULT_SETTINGS;
  }
}

/**
 * Clear settings cache (useful after updates)
 */
export function clearSettingsCacheServer(): void {
  settingsCache = null;
  cacheTime = 0;
  console.log('[Settings Server] Cache cleared');
}

/**
 * Get company info from settings (server-side)
 */
export async function getCompanyInfoServer() {
  const settings = await getAppSettingsServer();
  return settings.company;
}

/**
 * Get logo from settings (server-side, returns base64 or null)
 */
export async function getLogoServer(): Promise<string | null> {
  const settings = await getAppSettingsServer();
  return settings.logo?.base64 || null;
}

/**
 * Get Brevo configuration from settings (server-side)
 */
export async function getBrevoConfigServer() {
  const settings = await getAppSettingsServer();
  return settings.brevo;
}
