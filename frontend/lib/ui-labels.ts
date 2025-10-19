// lib/ui-labels.ts
// Sistema per gestire le etichette dell'interfaccia in modo configurabile

import uiLabelsData from '@/config/ui-labels.json';
import { TranslatedField } from '@/types/product';

type NestedLabels = {
  [key: string]: string | NestedLabels;
};

/**
 * Recupera un'etichetta tradotta dal file di configurazione
 * @param path - Percorso dell'etichetta separato da punti (es. "product.code") oppure valore già tradotto
 * @param lang - Codice lingua (default: 'it')
 * @param replacements - Oggetto con valori da sostituire nei placeholder {key}
 */
export function getLabel(
  path: string | Record<string, string> | TranslatedField | null | undefined,
  lang: string = 'it',
  replacements?: Record<string, string | number>
): string {
  // Se è null o undefined, ritorna stringa vuota
  if (!path) return '';

  // Se è già un oggetto tradotto (TranslatedField o Record), estrarre la lingua
  if (typeof path === 'object') {
    const translated = path as TranslatedField | Record<string, string>;
    return translated[lang] || translated['it'] || Object.values(translated)[0] || '';
  }

  // Altrimenti procedi con la logica normale per il path (string)
  const keys = (path as string).split('.');
  let current: any = uiLabelsData;

  // Naviga nell'oggetto seguendo il path
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      console.warn(`Label not found: ${path}`);
      return path as string; // Fallback al path stesso
    }
  }

  // Se il valore finale è un oggetto con traduzioni, prendi la lingua
  if (current && typeof current === 'object') {
    const label = current[lang] || current['it'] || Object.values(current)[0];

    // Sostituisci eventuali placeholder
    if (replacements && typeof label === 'string') {
      return Object.entries(replacements).reduce(
        (str, [key, value]) => str.replace(`{${key}}`, String(value)),
        label
      );
    }

    return String(label);
  }

  return String(current);
}

/**
 * Hook helper per usare le label nei componenti
 */
export function useLabels(lang: string = 'it') {
  return {
    get: (path: string, replacements?: Record<string, string | number>) =>
      getLabel(path, lang, replacements),
    lang,
  };
}

/**
 * Ottiene tutte le label di una sezione
 */
export function getSectionLabels(section: string, lang: string = 'it'): Record<string, string> {
  const keys = section.split('.');
  let current: any = uiLabelsData;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return {};
    }
  }

  // Appiattisce l'oggetto prendendo i valori tradotti
  const flatten = (obj: any, prefix: string = ''): Record<string, string> => {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object') {
        // Se ha chiavi di lingua, prendi la traduzione
        if ('it' in value || 'en' in value) {
          result[newKey] = String((value as any)[lang] || (value as any)['it'] || '');
        } else {
          // Altrimenti continua a navigare
          Object.assign(result, flatten(value, newKey));
        }
      }
    }

    return result;
  };

  return flatten(current);
}
