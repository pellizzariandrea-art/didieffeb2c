// Centralized translations for common/shared components (Header, Footer, etc.)
// Supports 9 languages: it, en, de, fr, es, pt, hr, sl, el

export type Language = 'it' | 'en' | 'de' | 'fr' | 'es' | 'pt' | 'hr' | 'sl' | 'el';

export const COMMON_TEXTS = {
  // SiteHeader - Navigation
  navHome: {
    it: 'Home',
    en: 'Home',
    de: 'Startseite',
    fr: 'Accueil',
    es: 'Inicio',
    pt: 'Início',
    hr: 'Početna',
    sl: 'Domov',
    el: 'Αρχική',
  },

  navCompany: {
    it: 'Azienda',
    en: 'About',
    de: 'Über uns',
    fr: 'À propos',
    es: 'Empresa',
    pt: 'Empresa',
    hr: 'Tvrtka',
    sl: 'Podjetje',
    el: 'Εταιρεία',
  },

  navCatalog: {
    it: 'Catalogo',
    en: 'Catalog',
    de: 'Katalog',
    fr: 'Catalogue',
    es: 'Catálogo',
    pt: 'Catálogo',
    hr: 'Katalog',
    sl: 'Katalog',
    el: 'Κατάλογος',
  },

  navCareers: {
    it: 'Lavora con Noi',
    en: 'Careers',
    de: 'Karriere',
    fr: 'Carrières',
    es: 'Trabaja con Nosotros',
    pt: 'Trabalhe Conosco',
    hr: 'Karijere',
    sl: 'Kariere',
    el: 'Καριέρες',
  },

  navContact: {
    it: 'Contatti',
    en: 'Contact',
    de: 'Kontakt',
    fr: 'Contact',
    es: 'Contacto',
    pt: 'Contato',
    hr: 'Kontakt',
    sl: 'Stik',
    el: 'Επικοινωνία',
  },

  // CategoryGrid
  precisionComponents: {
    it: 'Componenti di precisione progettati per performance eccezionali e lunga durata.',
    en: 'Precision components designed for exceptional performance and long lifespan.',
    de: 'Präzisionskomponenten für außergewöhnliche Leistung und Langlebigkeit.',
    fr: 'Composants de précision conçus pour des performances exceptionnelles et une longue durée de vie.',
    es: 'Componentes de precisión diseñados para rendimiento excepcional y larga duración.',
    pt: 'Componentes de precisão projetados para desempenho excepcional e longa vida útil.',
    hr: 'Precizne komponente dizajnirane za iznimnu izvedbu i dug vijek trajanja.',
    sl: 'Natančne komponente, zasnovane za izjemno zmogljivost in dolgo življenjsko dobo.',
    el: 'Εξαρτήματα ακριβείας σχεδιασμένα για εξαιρετική απόδοση και μακροζωία.',
  },

  serie: {
    it: 'Serie',
    en: 'Series',
    de: 'Serie',
    fr: 'Série',
    es: 'Serie',
    pt: 'Série',
    hr: 'Serija',
    sl: 'Serija',
    el: 'Σειρά',
  },

  linea: {
    it: 'Linea',
    en: 'Line',
    de: 'Linie',
    fr: 'Ligne',
    es: 'Línea',
    pt: 'Linha',
    hr: 'Linija',
    sl: 'Linija',
    el: 'Γραμμή',
  },

  applicazione: {
    it: 'Applicazione',
    en: 'Application',
    de: 'Anwendung',
    fr: 'Application',
    es: 'Aplicación',
    pt: 'Aplicação',
    hr: 'Primjena',
    sl: 'Aplikacija',
    el: 'Εφαρμογή',
  },

  products: {
    it: 'prodotti',
    en: 'products',
    de: 'Produkte',
    fr: 'produits',
    es: 'productos',
    pt: 'produtos',
    hr: 'proizvodi',
    sl: 'izdelki',
    el: 'προϊόντα',
  },

  exploreAllProducts: {
    it: 'Esplora tutti i prodotti',
    en: 'Explore all products',
    de: 'Alle Produkte erkunden',
    fr: 'Explorer tous les produits',
    es: 'Explorar todos los productos',
    pt: 'Explorar todos os produtos',
    hr: 'Istražite sve proizvode',
    sl: 'Raziščite vse izdelke',
    el: 'Εξερευνήστε όλα τα προϊόντα',
  },
};

// Helper function to get translation text
export function getCommonText<K extends keyof typeof COMMON_TEXTS>(
  key: K,
  lang: Language = 'it'
): string {
  const text = COMMON_TEXTS[key];
  return text[lang] || text.it;
}
