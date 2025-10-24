// lib/firebase/settings.ts
// Firestore operations for application settings

import { dbInstance } from './config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AppSettings, DEFAULT_SETTINGS } from '@/types/settings';

const SETTINGS_DOC_ID = 'app-settings';
const SETTINGS_COLLECTION = 'settings';

// Cache for settings
let settingsCache: AppSettings | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get application settings from Firestore
 * @param useCache - Whether to use cached settings (default: true)
 * @returns Application settings or default if not found
 */
export async function getAppSettings(useCache: boolean = true): Promise<AppSettings> {
  // Return cached settings if still valid
  if (useCache && settingsCache && Date.now() - cacheTime < CACHE_DURATION) {
    console.log('[Settings] Using cached settings');
    return settingsCache;
  }

  try {
    console.log('[Settings] Loading from Firestore...');

    const docRef = doc(dbInstance!, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      let settings = docSnap.data() as AppSettings;
      console.log('[Settings] Loaded successfully');

      // Migrate old structure to new multilingual structure if needed
      if (settings.templates.b2c_welcome && !('translations' in settings.templates.b2c_welcome)) {
        console.log('[Settings] Migrating to multilingual structure...');
        const oldTemplates = settings.templates as any;

        settings.templates = {
          b2c_welcome: {
            enabled: oldTemplates.b2c_welcome.enabled ?? true,
            translations: {
              it: {
                subject: oldTemplates.b2c_welcome.subject || DEFAULT_SETTINGS.templates.b2c_welcome.translations.it.subject,
                body: DEFAULT_SETTINGS.templates.b2c_welcome.translations.it.body,
              },
              en: DEFAULT_SETTINGS.templates.b2c_welcome.translations.en,
              fr: DEFAULT_SETTINGS.templates.b2c_welcome.translations.fr,
              de: DEFAULT_SETTINGS.templates.b2c_welcome.translations.de,
              es: DEFAULT_SETTINGS.templates.b2c_welcome.translations.es,
              pt: DEFAULT_SETTINGS.templates.b2c_welcome.translations.pt,
            },
          },
          b2b_confirmation: {
            enabled: oldTemplates.b2b_confirmation.enabled ?? true,
            translations: {
              it: {
                subject: oldTemplates.b2b_confirmation.subject || DEFAULT_SETTINGS.templates.b2b_confirmation.translations.it.subject,
                body: DEFAULT_SETTINGS.templates.b2b_confirmation.translations.it.body,
              },
              en: DEFAULT_SETTINGS.templates.b2b_confirmation.translations.en,
              fr: DEFAULT_SETTINGS.templates.b2b_confirmation.translations.fr,
              de: DEFAULT_SETTINGS.templates.b2b_confirmation.translations.de,
              es: DEFAULT_SETTINGS.templates.b2b_confirmation.translations.es,
              pt: DEFAULT_SETTINGS.templates.b2b_confirmation.translations.pt,
            },
          },
        };

        // Save migrated structure back to Firestore
        try {
          await setDoc(docRef, settings, { merge: true });
          console.log('[Settings] Migration completed and saved');
        } catch (error) {
          console.error('[Settings] Error saving migration:', error);
        }
      }

      // Update cache
      settingsCache = settings;
      cacheTime = Date.now();

      return settings;
    } else {
      console.log('[Settings] No settings found, returning defaults');
      return DEFAULT_SETTINGS;
    }
  } catch (error) {
    console.error('[Settings] Error loading settings, using defaults:', error);
    // Return defaults instead of throwing error
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save application settings to Firestore
 * @param settings - Application settings to save
 * @param userId - Optional user ID who made the changes
 */
export async function saveAppSettings(
  settings: AppSettings,
  userId?: string
): Promise<void> {
  try {
    console.log('[Settings] Saving to Firestore:', settings);

    // Add metadata
    const settingsWithMeta = {
      ...settings,
      updatedAt: new Date().toISOString(),
      updatedBy: userId || 'system',
    };

    const docRef = doc(dbInstance!, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    await setDoc(docRef, settingsWithMeta, { merge: true });

    // Invalidate cache
    settingsCache = null;

    console.log('[Settings] Saved successfully');
  } catch (error) {
    console.error('[Settings] Error saving settings:', error);
    throw new Error('Failed to save application settings');
  }
}

/**
 * Update logo in settings
 * @param base64 - Base64 encoded logo
 * @param type - MIME type of the image
 * @param userId - Optional user ID who made the changes
 */
export async function updateLogo(
  base64: string,
  type: string,
  userId?: string
): Promise<void> {
  try {
    console.log('[Settings] Updating logo...');

    // Get current settings
    const settings = await getAppSettings(false); // Don't use cache

    // Update logo
    settings.logo = {
      base64,
      type,
      uploadedAt: new Date().toISOString(),
    };

    // Save updated settings
    await saveAppSettings(settings, userId);

    console.log('[Settings] Logo updated successfully');
  } catch (error) {
    console.error('[Settings] Error updating logo:', error);
    throw new Error('Failed to update logo');
  }
}

/**
 * Clear settings cache (useful after updates)
 */
export function clearSettingsCache(): void {
  settingsCache = null;
  cacheTime = 0;
  console.log('[Settings] Cache cleared');
}

/**
 * Get company info from settings
 */
export async function getCompanyInfo() {
  const settings = await getAppSettings();
  return settings.company;
}

/**
 * Get logo from settings (returns base64 or null)
 */
export async function getLogo(): Promise<string | null> {
  const settings = await getAppSettings();
  return settings.logo?.base64 || null;
}

/**
 * Get Brevo configuration from settings
 */
export async function getBrevoConfig() {
  const settings = await getAppSettings();
  return settings.brevo;
}

/**
 * Get email templates configuration from settings
 */
export async function getEmailTemplates() {
  const settings = await getAppSettings();
  return settings.templates;
}
