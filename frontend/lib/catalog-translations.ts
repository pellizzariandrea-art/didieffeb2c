// Centralized translations for B2C catalog components
// Supports 9 languages: it, en, de, fr, es, pt, hr, sl, el

export type Language = 'it' | 'en' | 'de' | 'fr' | 'es' | 'pt' | 'hr' | 'sl' | 'el';

export const CATALOG_TEXTS = {
  // ProductCatalog - Search button
  searchButton: {
    it: 'Cerca',
    en: 'Search',
    de: 'Suchen',
    fr: 'Chercher',
    es: 'Buscar',
    pt: 'Buscar',
    hr: 'Pretraži',
    sl: 'Iskanje',
    el: 'Αναζήτηση',
  },

  // ProductCatalog - Search results messages
  foundExactResults: {
    it: (count: number, query: string) => `Trovati ${count} risultati esatti per "${query}"`,
    en: (count: number, query: string) => `Found ${count} exact results for "${query}"`,
    de: (count: number, query: string) => `${count} exakte Ergebnisse für "${query}" gefunden`,
    fr: (count: number, query: string) => `${count} résultats exacts trouvés pour "${query}"`,
    es: (count: number, query: string) => `${count} resultados exactos encontrados para "${query}"`,
    pt: (count: number, query: string) => `${count} resultados exatos encontrados para "${query}"`,
    hr: (count: number, query: string) => `Pronađeno ${count} točnih rezultata za "${query}"`,
    sl: (count: number, query: string) => `Najdenih ${count} natančnih rezultatov za "${query}"`,
    el: (count: number, query: string) => `Βρέθηκαν ${count} ακριβή αποτελέσματα για "${query}"`,
  },

  alsoShowingRelated: {
    it: (count: number) => `Mostriamo anche ${count} prodotti correlati`,
    en: (count: number) => `Also showing ${count} related products`,
    de: (count: number) => `Zeige auch ${count} verwandte Produkte`,
    fr: (count: number) => `Affiche également ${count} produits associés`,
    es: (count: number) => `También mostrando ${count} productos relacionados`,
    pt: (count: number) => `Também mostrando ${count} produtos relacionados`,
    hr: (count: number) => `Također prikazujemo ${count} povezanih proizvoda`,
    sl: (count: number) => `Prikazujemo tudi ${count} povezanih izdelkov`,
    el: (count: number) => `Εμφανίζονται επίσης ${count} σχετικά προϊόντα`,
  },

  noExactResults: {
    it: (query: string) => `Nessun risultato esatto per "${query}"`,
    en: (query: string) => `No exact results for "${query}"`,
    de: (query: string) => `Keine exakten Ergebnisse für "${query}"`,
    fr: (query: string) => `Aucun résultat exact pour "${query}"`,
    es: (query: string) => `No hay resultados exactos para "${query}"`,
    pt: (query: string) => `Nenhum resultado exato para "${query}"`,
    hr: (query: string) => `Nema točnih rezultata za "${query}"`,
    sl: (query: string) => `Ni natančnih rezultatov za "${query}"`,
    el: (query: string) => `Δεν υπάρχουν ακριβή αποτελέσματα για "${query}"`,
  },

  showingRelatedProducts: {
    it: (count: number) => `Mostriamo ${count} prodotti correlati che potrebbero interessarti`,
    en: (count: number) => `Showing ${count} related products that might interest you`,
    de: (count: number) => `Zeige ${count} verwandte Produkte, die Sie interessieren könnten`,
    fr: (count: number) => `Affichage de ${count} produits associés qui pourraient vous intéresser`,
    es: (count: number) => `Mostrando ${count} productos relacionados que podrían interesarte`,
    pt: (count: number) => `Mostrando ${count} produtos relacionados que podem interessar`,
    hr: (count: number) => `Prikazujemo ${count} povezanih proizvoda koji bi vas mogli zanimati`,
    sl: (count: number) => `Prikazujemo ${count} povezanih izdelkov, ki bi vas lahko zanimali`,
    el: (count: number) => `Εμφανίζονται ${count} σχετικά προϊόντα που ενδέχεται να σας ενδιαφέρουν`,
  },

  selectedProduct: {
    it: 'Prodotto selezionato',
    en: 'Selected product',
    de: 'Ausgewähltes Produkt',
    fr: 'Produit sélectionné',
    es: 'Producto seleccionado',
    pt: 'Produto selecionado',
    hr: 'Odabrani proizvod',
    sl: 'Izbrani izdelek',
    el: 'Επιλεγμένο προϊόν',
  },

  removeButton: {
    it: 'Rimuovi',
    en: 'Remove',
    de: 'Entfernen',
    fr: 'Supprimer',
    es: 'Eliminar',
    pt: 'Remover',
    hr: 'Ukloni',
    sl: 'Odstrani',
    el: 'Αφαίρεση',
  },

  viewDetailsButton: {
    it: 'Vedi dettagli',
    en: 'View details',
    de: 'Details anzeigen',
    fr: 'Voir détails',
    es: 'Ver detalles',
    pt: 'Ver detalhes',
    hr: 'Pogledaj detalje',
    sl: 'Prikaži podrobnosti',
    el: 'Προβολή λεπτομερειών',
  },

  relatedProducts: {
    it: 'Prodotti correlati',
    en: 'Related products',
    de: 'Verwandte Produkte',
    fr: 'Produits associés',
    es: 'Productos relacionados',
    pt: 'Produtos relacionados',
    hr: 'Povezani proizvodi',
    sl: 'Povezani izdelki',
    el: 'Σχετικά προϊόντα',
  },

  // SearchAutocomplete
  showAllResults: {
    it: (count: number) => `Mostra tutti i ${count} risultati`,
    en: (count: number) => `Show all ${count} results`,
    de: (count: number) => `Alle ${count} Ergebnisse anzeigen`,
    fr: (count: number) => `Afficher les ${count} résultats`,
    es: (count: number) => `Mostrar los ${count} resultados`,
    pt: (count: number) => `Mostrar todos os ${count} resultados`,
    hr: (count: number) => `Prikaži svih ${count} rezultata`,
    sl: (count: number) => `Prikaži vseh ${count} rezultatov`,
    el: (count: number) => `Εμφάνιση όλων των ${count} αποτελεσμάτων`,
  },

  viewRelatedProducts: {
    it: (count: number) => `Vedi ${count} prodotti correlati`,
    en: (count: number) => `View ${count} related products`,
    de: (count: number) => `${count} verwandte Produkte anzeigen`,
    fr: (count: number) => `Voir ${count} produits associés`,
    es: (count: number) => `Ver ${count} productos relacionados`,
    pt: (count: number) => `Ver ${count} produtos relacionados`,
    hr: (count: number) => `Pogledaj ${count} povezanih proizvoda`,
    sl: (count: number) => `Prikaži ${count} povezanih izdelkov`,
    el: (count: number) => `Προβολή ${count} σχετικών προϊόντων`,
  },

  enterToViewAll: {
    it: 'per vedere tutti',
    en: 'to view all',
    de: 'um alle zu sehen',
    fr: 'pour tout voir',
    es: 'para ver todos',
    pt: 'para ver todos',
    hr: 'za pregled svih',
    sl: 'za ogled vseh',
    el: 'για προβολή όλων',
  },

  // AIDescription
  preparingDocumentation: {
    it: 'Stiamo preparando la documentazione per te',
    en: 'We are preparing the documentation for you',
    de: 'Wir bereiten die Dokumentation für Sie vor',
    fr: 'Nous préparons la documentation pour vous',
    es: 'Estamos preparando la documentación para ti',
    pt: 'Estamos preparando a documentação para você',
    hr: 'Pripremamo dokumentaciju za vas',
    sl: 'Pripravljamo dokumentacijo za vas',
    el: 'Προετοιμάζουμε την τεκμηρίωση για εσάς',
  },

  processing: {
    it: 'Elaborazione',
    en: 'Processing',
    de: 'Verarbeitung',
    fr: 'Traitement',
    es: 'Procesando',
    pt: 'Processando',
    hr: 'Obrada',
    sl: 'Obdelava',
    el: 'Επεξεργασία',
  },

  // Home/BrandShowcase
  brandDescription: {
    it: 'Con oltre 30 anni di esperienza, il nostro gruppo offre soluzioni complete per ogni esigenza nel settore della ferramenta per serramenti. Ogni brand del gruppo è specializzato in un segmento specifico, garantendo competenza e qualità.',
    en: 'With over 30 years of experience, our group offers complete solutions for every need in the window and door hardware sector. Each brand in the group specializes in a specific segment, ensuring expertise and quality.',
    de: 'Mit über 30 Jahren Erfahrung bietet unsere Gruppe vollständige Lösungen für jeden Bedarf im Bereich Fenster- und Türbeschläge. Jede Marke der Gruppe ist auf ein bestimmtes Segment spezialisiert und gewährleistet Expertise und Qualität.',
    fr: 'Avec plus de 30 ans d\'expérience, notre groupe offre des solutions complètes pour chaque besoin dans le secteur de la quincaillerie pour fenêtres et portes. Chaque marque du groupe est spécialisée dans un segment spécifique, garantissant expertise et qualité.',
    es: 'Con más de 30 años de experiencia, nuestro grupo ofrece soluciones completas para cada necesidad en el sector de herrajes para ventanas y puertas. Cada marca del grupo se especializa en un segmento específico, garantizando experiencia y calidad.',
    pt: 'Com mais de 30 anos de experiência, o nosso grupo oferece soluções completas para cada necessidade no setor de ferragens para janelas e portas. Cada marca do grupo é especializada num segmento específico, garantindo experiência e qualidade.',
    hr: 'S više od 30 godina iskustva, naša grupa nudi potpuna rješenja za svaku potrebu u sektoru okova za prozore i vrata. Svaka marka u grupi specijalizirana je za određeni segment, osiguravajući stručnost i kvalitetu.',
    sl: 'Z več kot 30-letnimi izkušnjami naša skupina ponuja celovite rešitve za vsako potrebo v sektorju okovja za okna in vrata. Vsaka blagovna znamka v skupini je specializirana za določen segment, kar zagotavlja strokovnost in kakovost.',
    el: 'Με πάνω από 30 χρόνια εμπειρίας, ο όμιλός μας προσφέρει ολοκληρωμένες λύσεις για κάθε ανάγκη στον τομέα των εξαρτημάτων παραθύρων και θυρών. Κάθε μάρκα του ομίλου ειδικεύεται σε ένα συγκεκριμένο τμήμα, εξασφαλίζοντας εμπειρογνωμοσύνη και ποιότητα.',
  },

  // Home/WhyChooseUs
  whyChooseUs: {
    it: 'Perché sceglierci',
    en: 'Why choose us',
    de: 'Warum uns wählen',
    fr: 'Pourquoi nous choisir',
    es: 'Por qué elegirnos',
    pt: 'Por que nos escolher',
    hr: 'Zašto odabrati nas',
    sl: 'Zakaj izbrati nas',
    el: 'Γιατί να μας επιλέξετε',
  },

  qualityWithoutCompromise: {
    it: 'Qualità senza compromessi',
    en: 'Quality without compromise',
    de: 'Qualität ohne Kompromisse',
    fr: 'Qualité sans compromis',
    es: 'Calidad sin compromisos',
    pt: 'Qualidade sem compromissos',
    hr: 'Kvaliteta bez kompromisa',
    sl: 'Kakovost brez kompromisov',
    el: 'Ποιότητα χωρίς συμβιβασμούς',
  },

  experienceDescription: {
    it: '40 anni di esperienza al servizio dell\'eccellenza manifatturiera italiana',
    en: '40 years of experience serving Italian manufacturing excellence',
    de: '40 Jahre Erfahrung im Dienste der italienischen Fertigungsexzellenz',
    fr: '40 ans d\'expérience au service de l\'excellence manufacturière italienne',
    es: '40 años de experiencia al servicio de la excelencia manufacturera italiana',
    pt: '40 anos de experiência a serviço da excelência manufatureira italiana',
    hr: '40 godina iskustva u službi talijanske proizvodne izvrsnosti',
    sl: '40 let izkušenj v službi italijanske proizvodne odličnosti',
    el: '40 χρόνια εμπειρίας στην υπηρεσία της ιταλικής κατασκευαστικής αριστείας',
  },

  products: {
    it: 'Prodotti',
    en: 'Products',
    de: 'Produkte',
    fr: 'Produits',
    es: 'Productos',
    pt: 'Produtos',
    hr: 'Proizvodi',
    sl: 'Izdelki',
    el: 'Προϊόντα',
  },

  clients: {
    it: 'Clienti',
    en: 'Clients',
    de: 'Kunden',
    fr: 'Clients',
    es: 'Clientes',
    pt: 'Clientes',
    hr: 'Klijenti',
    sl: 'Stranke',
    el: 'Πελάτες',
  },

  satisfaction: {
    it: 'Soddisfazione',
    en: 'Satisfaction',
    de: 'Zufriedenheit',
    fr: 'Satisfaction',
    es: 'Satisfacción',
    pt: 'Satisfação',
    hr: 'Zadovoljstvo',
    sl: 'Zadovoljstvo',
    el: 'Ικανοποίηση',
  },

  support: {
    it: 'Supporto',
    en: 'Support',
    de: 'Unterstützung',
    fr: 'Assistance',
    es: 'Soporte',
    pt: 'Suporte',
    hr: 'Podrška',
    sl: 'Podpora',
    el: 'Υποστήριξη',
  },

  // Home/HeroSection
  exploreAllProducts: {
    it: 'Esplora Tutti i Prodotti',
    en: 'Explore All Products',
    de: 'Alle Produkte entdecken',
    fr: 'Explorer Tous les Produits',
    es: 'Explorar Todos los Productos',
    pt: 'Explorar Todos os Produtos',
    hr: 'Istražite sve proizvode',
    sl: 'Raziščite vse izdelke',
    el: 'Εξερευνήστε όλα τα προϊόντα',
  },
};

// Helper function to get translation text
export function getCatalogText<K extends keyof typeof CATALOG_TEXTS>(
  key: K,
  lang: Language = 'it'
): typeof CATALOG_TEXTS[K][Language] {
  const text = CATALOG_TEXTS[key];
  return text[lang] || text.it;
}

// Helper function for function-based translations
export function getCatalogTextFn<K extends keyof typeof CATALOG_TEXTS>(
  key: K,
  lang: Language = 'it',
  ...args: any[]
): string {
  const textObj = CATALOG_TEXTS[key] as any;
  const fn = textObj[lang] || textObj.it;

  if (typeof fn === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return fn.apply(null, args);
  }

  return fn as string;
}
