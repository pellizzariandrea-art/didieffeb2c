// ============================================================
// CONFIGURAZIONE LINGUE - PUNTO CENTRALE
// ============================================================
// Modifica questo file per aggiungere/rimuovere lingue in tutto il sistema

export interface Language {
  code: string;        // Codice ISO 639-1 (it, en, de, fr, es, pt, ru, zh, ja, etc.)
  name: string;        // Nome in lingua locale
  flag: string;        // Emoji bandiera
  enabled: boolean;    // Abilitata nel sistema
}

// ============================================================
// LINGUE SUPPORTATE
// ============================================================
// Per aggiungere una nuova lingua:
// 1. Aggiungi qui la configurazione
// 2. Modifica admin/pages/settings.php (aggiungi checkbox)
// 3. Claude tradurrà automaticamente i testi

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'it', name: 'Italiano', flag: '🇮🇹', enabled: true },   // Base - non disabilitare
  { code: 'en', name: 'English', flag: '🇬🇧', enabled: true },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', enabled: true },
  { code: 'fr', name: 'Français', flag: '🇫🇷', enabled: true },
  { code: 'es', name: 'Español', flag: '🇪🇸', enabled: true },
  { code: 'pt', name: 'Português', flag: '🇵🇹', enabled: true },
  { code: 'hr', name: 'Hrvatski', flag: '🇭🇷', enabled: true },   // Croato
  { code: 'sl', name: 'Slovenščina', flag: '🇸🇮', enabled: true }, // Sloveno
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷', enabled: true },    // Greco

  // ⬇️ AGGIUNGI ALTRE LINGUE QUI
  // Decommenta per abilitare:

  // { code: 'ru', name: 'Русский', flag: '🇷🇺', enabled: false },      // Russo
  // { code: 'zh', name: '中文', flag: '🇨🇳', enabled: false },            // Cinese
  // { code: 'ja', name: '日本語', flag: '🇯🇵', enabled: false },          // Giapponese
  // { code: 'ar', name: 'العربية', flag: '🇸🇦', enabled: false },       // Arabo
  // { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', enabled: false },        // Hindi
  // { code: 'ko', name: '한국어', flag: '🇰🇷', enabled: false },          // Coreano
  // { code: 'nl', name: 'Nederlands', flag: '🇳🇱', enabled: false },   // Olandese
  // { code: 'pl', name: 'Polski', flag: '🇵🇱', enabled: false },        // Polacco
  // { code: 'tr', name: 'Türkçe', flag: '🇹🇷', enabled: false },        // Turco
  // { code: 'sv', name: 'Svenska', flag: '🇸🇪', enabled: false },       // Svedese
  // { code: 'da', name: 'Dansk', flag: '🇩🇰', enabled: false },         // Danese
  // { code: 'no', name: 'Norsk', flag: '🇳🇴', enabled: false },         // Norvegese
  // { code: 'fi', name: 'Suomi', flag: '🇫🇮', enabled: false },         // Finlandese
  // { code: 'cs', name: 'Čeština', flag: '🇨🇿', enabled: false },       // Ceco
  // { code: 'ro', name: 'Română', flag: '🇷🇴', enabled: false },        // Rumeno
  // { code: 'hu', name: 'Magyar', flag: '🇭🇺', enabled: false },        // Ungherese
  // { code: 'el', name: 'Ελληνικά', flag: '🇬🇷', enabled: false },     // Greco
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Ottiene tutte le lingue abilitate
 */
export function getEnabledLanguages(): Language[] {
  return SUPPORTED_LANGUAGES.filter(lang => lang.enabled);
}

/**
 * Ottiene i codici delle lingue abilitate
 */
export function getEnabledLanguageCodes(): string[] {
  return getEnabledLanguages().map(lang => lang.code);
}

/**
 * Ottiene una lingua dal codice
 */
export function getLanguageByCode(code: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

/**
 * Verifica se una lingua è abilitata
 */
export function isLanguageEnabled(code: string): boolean {
  const lang = getLanguageByCode(code);
  return lang?.enabled ?? false;
}

/**
 * Lingua base (sempre italiana)
 */
export const BASE_LANGUAGE: Language = SUPPORTED_LANGUAGES[0];

/**
 * Codici lingua per validazione TEXTS
 * Usato in ComponentCustomizer per validare che tutti i TEXTS abbiano tutte le lingue
 */
export const REQUIRED_LANGUAGE_CODES = getEnabledLanguageCodes();
