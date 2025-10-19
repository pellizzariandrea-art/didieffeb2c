// types/product.ts
// Tipi TypeScript per i prodotti dal JSON

export interface Product {
  codice: string;
  nome: string | TranslatedField;
  descrizione?: string | TranslatedField;
  prezzo: number;
  immagine?: string;
  immagini?: string[];
  disponibilita?: number;
  attributi?: Record<string, any>;
  risorse?: Resource[];
  variants?: Variant[];
  variantGroupId?: string;
  isVariantGroup?: boolean;
  variantGroupTotal?: number; // Numero totale di varianti nel gruppo
  variantQualifiers?: Record<string, any>; // Qualificatori di questa specifica variante
}

export type TranslatedField = {
  it: string;
  en?: string;
  de?: string;
  fr?: string;
  es?: string;
  pt?: string;
} & Record<string, string | undefined>;

export interface Resource {
  category: string;
  url: string;
  icon: string;
  extension: string;
}

export interface Variant {
  codice: string;
  variantOrder: number;
  qualifiers: Record<string, any>;
  prezzo: number;
  immagine?: string;
  immagini?: string[] | null;
  attributi: Record<string, any>;
}

export interface ProductsResponse {
  prodotti: Product[];
  generated_at: string;
  total: number;
  _meta?: {
    languages: string[];
    filters?: any[];
    categories?: any[];
  };
}
