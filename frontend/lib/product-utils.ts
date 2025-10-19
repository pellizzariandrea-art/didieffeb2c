// lib/product-utils.ts
// Utility functions per prodotti (client & server safe)

/**
 * Helper per ottenere valore tradotto
 */
export function getTranslatedValue(
  value: string | Record<string, string> | null | undefined,
  lang: string = 'it'
): string {
  // Controllo null/undefined
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  // Controllo se è un oggetto valido
  if (typeof value === 'object' && value !== null) {
    return value[lang] || value['it'] || Object.values(value)[0] || '';
  }

  return '';
}

/**
 * Helper per formattare un valore di attributo in modo leggibile
 */
export function formatAttributeValue(value: any, lang: string = 'it'): string {
  // Se è null o undefined
  if (value === null || value === undefined) {
    return '-';
  }

  // Se è una stringa
  if (typeof value === 'string') {
    return value;
  }

  // Se è un numero
  if (typeof value === 'number') {
    return String(value);
  }

  // Se è un booleano, normalizza a "1" o "0" per compatibilità backend
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }

  // Se è un oggetto
  if (typeof value === 'object') {
    // Controlla se è un oggetto multilingua (ha chiavi di lingua)
    const langKeys = ['it', 'en', 'de', 'fr', 'es', 'pt'];
    const hasLangKey = Object.keys(value).some(k => langKeys.includes(k));

    if (hasLangKey) {
      // È un oggetto tradotto, usa getTranslatedValue
      return getTranslatedValue(value, lang);
    }

    // Controlla se ha struttura label/value
    if ('label' in value && 'value' in value) {
      // Se value.value è un oggetto tradotto, usa getTranslatedValue
      if (typeof value.value === 'object') {
        return getTranslatedValue(value.value, lang);
      }
      // Se value.value è booleano, normalizza a "1" o "0" per compatibilità backend
      if (typeof value.value === 'boolean') {
        return value.value ? '1' : '0';
      }
      // Altrimenti converti in stringa
      return String(value.value);
    }

    // Altrimenti formatta come "key: value"
    return Object.entries(value)
      .map(([k, v]) => {
        if (typeof v === 'object') {
          return `${k}: ${formatAttributeValue(v, lang)}`;
        }
        return `${k}: ${v}`;
      })
      .join(', ');
  }

  // Fallback
  return String(value);
}
