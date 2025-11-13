// lib/product-utils.ts
// Utility functions per prodotti (client & server safe)

import { getLabel } from './ui-labels';

/**
 * Helper per tradurre la label di un attributo
 * Cerca prima in ui-labels.json, poi nei dati del prodotto, infine fallback al nome della chiave
 */
export function getAttributeLabel(
  key: string,
  lang: string = 'it',
  productAttributes?: Record<string, any>
): string {
  // Prima prova a cercare una traduzione in ui-labels.json per attributi comuni
  const normalizedKey = key.toLowerCase();
  const attributeLabel = getLabel(`attributes.${normalizedKey}`, lang);
  if (attributeLabel) {
    return attributeLabel;
  }

  // Se non trovata, usa i dati del prodotto
  if (productAttributes && productAttributes[key]) {
    const attr = productAttributes[key];

    // Se l'attributo ha una label, usala
    if (typeof attr === 'object' && attr !== null && 'label' in attr && attr.label) {
      return getTranslatedValue(attr.label, lang);
    }
  }

  // Altrimenti ritorna la chiave
  return key;
}

/**
 * Helper per tradurre il valore di un attributo dalle varianti
 * Cerca la traduzione negli attributi del prodotto master, varianti e in tutti i prodotti del catalogo
 */
export function getAttributeValue(
  key: string,
  value: string | any,
  lang: string = 'it',
  productAttributes?: Record<string, any>,
  allVariants?: any[],
  groupProducts?: any[]
): string {
  // Se non è una stringa, usa getTranslatedValue normale
  if (typeof value !== 'string') {
    if (typeof value === 'object' && value !== null) {
      return getTranslatedValue(value, lang);
    }
    return String(value);
  }

  const valueTrimmed = value.trim();

  // Cerca prima negli attributi del prodotto master
  if (productAttributes && productAttributes[key]) {
    const attr = productAttributes[key];

    // Se l'attributo ha una struttura value multilingua
    if (typeof attr === 'object' && attr !== null && 'value' in attr && attr.value) {
      if (typeof attr.value === 'object') {
        // Confronta con il valore italiano (trimmed)
        const italianValue = getTranslatedValue(attr.value, 'it').trim();
        if (italianValue.toLowerCase() === valueTrimmed.toLowerCase()) {
          // Ritorna la traduzione nella lingua corrente
          return getTranslatedValue(attr.value, lang);
        }
      }
    }
    // Se è un oggetto multilingua diretto
    else if (typeof attr === 'object' && attr !== null && !('label' in attr)) {
      const italianValue = getTranslatedValue(attr, 'it').trim();
      if (italianValue.toLowerCase() === valueTrimmed.toLowerCase()) {
        return getTranslatedValue(attr, lang);
      }
    }
  }

  // Cerca nelle varianti
  if (allVariants) {
    for (const variant of allVariants) {
      if (variant.attributi && variant.attributi[key]) {
        const attr = variant.attributi[key];

        // Se l'attributo ha una struttura value multilingua
        if (typeof attr === 'object' && attr !== null && 'value' in attr && attr.value) {
          if (typeof attr.value === 'object') {
            const italianValue = getTranslatedValue(attr.value, 'it').trim();
            if (italianValue.toLowerCase() === valueTrimmed.toLowerCase()) {
              return getTranslatedValue(attr.value, lang);
            }
          }
        }
      }
    }
  }

  // Cerca tra tutti i prodotti del catalogo (le traduzioni sono sparse nei vari prodotti)
  if (groupProducts) {
    for (const product of groupProducts) {
      if (product.attributi && product.attributi[key]) {
        const attr = product.attributi[key];

        // Gli attributi in groupProducts sono DIRETTAMENTE oggetti multilingua {it: "...", en: "...", ...}
        // NON hanno la struttura {label: {...}, value: {...}}
        if (typeof attr === 'object' && attr !== null) {
          // Se ha 'value' allora usa quella struttura
          if ('value' in attr && attr.value) {
            if (typeof attr.value === 'object') {
              const italianValue = getTranslatedValue(attr.value, 'it').trim();
              if (italianValue.toLowerCase() === valueTrimmed.toLowerCase()) {
                return getTranslatedValue(attr.value, lang);
              }
            }
          }
          // Altrimenti è un oggetto multilingua DIRETTO
          else if ('it' in attr) {
            const italianValue = getTranslatedValue(attr, 'it').trim();
            if (italianValue.toLowerCase() === valueTrimmed.toLowerCase()) {
              return getTranslatedValue(attr, lang);
            }
          }
        }
      }
    }
  }

  // Se non trova traduzione, ritorna il valore originale
  return value;
}

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
