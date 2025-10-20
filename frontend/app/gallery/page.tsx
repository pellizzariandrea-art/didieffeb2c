'use client';

import { useBrand } from '@/contexts/BrandContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Images, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function GalleryPage() {
  const { brandConfig, currentBrand } = useBrand();
  const { currentLang } = useLanguage();

  // Collezioni per brand
  const collections = {
    antologia: [
      {
        id: 'porte-finestre',
        title: {
          it: 'Collezione Porte e Finestre',
          en: 'Doors and Windows Collection',
          de: 'Türen und Fenster Kollektion',
          fr: 'Collection Portes et Fenêtres',
          es: 'Colección Puertas y Ventanas',
          pt: 'Coleção Portas e Janelas'
        },
        description: {
          it: 'Maniglie eleganti per porte e finestre in ferro battuto e ottone',
          en: 'Elegant handles for doors and windows in wrought iron and brass',
          de: 'Elegante Griffe für Türen und Fenster aus Schmiedeeisen und Messing',
          fr: 'Poignées élégantes pour portes et fenêtres en fer forgé et laiton',
          es: 'Manijas elegantes para puertas y ventanas en hierro forjado y latón',
          pt: 'Maçanetas elegantes para portas e janelas em ferro forjado e latão'
        },
        count: '65 prodotti',
        image: '/images/brands/antologia-home.jpg',
        link: '/products?category=porte-finestre'
      },
      {
        id: 'complementi',
        title: {
          it: 'Collezione Complementi per Mobili',
          en: 'Furniture Accessories Collection',
          de: 'Möbel-Accessoires Kollektion',
          fr: 'Collection Accessoires pour Meubles',
          es: 'Colección Complementos para Muebles',
          pt: 'Coleção Complementos para Móveis'
        },
        description: {
          it: 'Maniglie e pomelli decorativi per mobili e arredamento classico',
          en: 'Decorative handles and knobs for classic furniture and furnishings',
          de: 'Dekorative Griffe und Knöpfe für klassische Möbel und Einrichtung',
          fr: 'Poignées et boutons décoratifs pour meubles et décoration classiques',
          es: 'Tiradores y pomos decorativos para muebles y decoración clásica',
          pt: 'Puxadores e maçanetas decorativas para móveis e decoração clássica'
        },
        count: '17 prodotti',
        image: '/images/brands/antologia-home.jpg',
        link: '/products?category=complementi'
      }
    ],
    didieffe: [
      {
        id: 'maniglie',
        title: {
          it: 'Maniglie per Serramenti',
          en: 'Window and Door Handles',
          de: 'Fenster- und Türgriffe',
          fr: 'Poignées pour Fenêtres et Portes',
          es: 'Manijas para Ventanas y Puertas',
          pt: 'Maçanetas para Janelas e Portas'
        },
        description: {
          it: 'Ampia gamma di maniglie in ferro battuto per ogni stile',
          en: 'Wide range of wrought iron handles for every style',
          de: 'Breites Sortiment an Schmiedeeisengriffen für jeden Stil',
          fr: 'Large gamme de poignées en fer forgé pour tous les styles',
          es: 'Amplia gama de manijas en hierro forjado para cada estilo',
          pt: 'Ampla gama de maçanetas em ferro forjado para cada estilo'
        },
        count: 'Catalogo completo',
        image: '/images/brands/didieffe-home.jpg',
        link: '/products'
      }
    ],
    hnox: [
      {
        id: 'inox-persiane',
        title: {
          it: 'Ferramenta in Acciaio Inox',
          en: 'Stainless Steel Hardware',
          de: 'Edelstahl-Beschläge',
          fr: 'Quincaillerie en Acier Inoxydable',
          es: 'Herrajes en Acero Inoxidable',
          pt: 'Ferragens em Aço Inoxidável'
        },
        description: {
          it: 'Soluzioni resistenti alla corrosione per ambienti marini e umidi',
          en: 'Corrosion-resistant solutions for marine and humid environments',
          de: 'Korrosionsbeständige Lösungen für Marine- und Feuchträume',
          fr: 'Solutions résistantes à la corrosion pour environnements marins et humides',
          es: 'Soluciones resistentes a la corrosión para ambientes marinos y húmedos',
          pt: 'Soluções resistentes à corrosão para ambientes marinhos e úmidos'
        },
        count: 'Catalogo completo',
        image: '/images/brands/hnox-home.jpg',
        link: '/products'
      }
    ],
    xtrend: [
      {
        id: 'design',
        title: {
          it: 'Design Made Ideas',
          en: 'Design Made Ideas',
          de: 'Design Made Ideas',
          fr: 'Design Made Ideas',
          es: 'Design Made Ideas',
          pt: 'Design Made Ideas'
        },
        description: {
          it: 'Maniglie di design contemporaneo personalizzabili',
          en: 'Customizable contemporary design handles',
          de: 'Anpassbare zeitgenössische Design-Griffe',
          fr: 'Poignées design contemporain personnalisables',
          es: 'Manijas de diseño contemporáneo personalizables',
          pt: 'Maçanetas de design contemporâneo personalizáveis'
        },
        count: 'Catalogo completo',
        image: '/images/brands/xtrend-home.jpg',
        link: '/products'
      }
    ]
  };

  const brandCollections = collections[currentBrand as keyof typeof collections] || collections.didieffe;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section
        className="py-32 px-4"
        style={{
          background: `linear-gradient(135deg, ${brandConfig.primaryColor}15, ${brandConfig.secondaryColor}15)`
        }}
      >
        <div className="container mx-auto text-center max-w-4xl">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{
              backgroundColor: `${brandConfig.primaryColor}20`,
              color: brandConfig.primaryColor
            }}
          >
            <Images className="w-10 h-10" />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Gallery
          </h1>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {currentLang === 'it' && 'Esplora le nostre collezioni di prodotti'}
            {currentLang === 'en' && 'Explore our product collections'}
            {currentLang === 'de' && 'Entdecken Sie unsere Produktkollektionen'}
            {currentLang === 'fr' && 'Explorez nos collections de produits'}
            {currentLang === 'es' && 'Explora nuestras colecciones de productos'}
            {currentLang === 'pt' && 'Explore nossas coleções de produtos'}
          </p>
        </div>
      </section>

      {/* Collections Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {brandCollections.map((collection) => (
              <Link
                key={collection.id}
                href={collection.link}
                className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-2"
              >
                <div className="aspect-video bg-gray-200 overflow-hidden">
                  <img
                    src={collection.image}
                    alt={collection.title[currentLang as keyof typeof collection.title]}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2
                      className="text-2xl font-bold"
                      style={{ color: brandConfig.primaryColor }}
                    >
                      {collection.title[currentLang as keyof typeof collection.title]}
                    </h2>
                    <ArrowRight
                      className="w-6 h-6 group-hover:translate-x-2 transition-transform"
                      style={{ color: brandConfig.primaryColor }}
                    />
                  </div>
                  <p className="text-gray-600 mb-4">
                    {collection.description[currentLang as keyof typeof collection.description]}
                  </p>
                  <span className="text-sm font-semibold text-gray-500">
                    {collection.count}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            {currentLang === 'it' && 'Esplora il catalogo completo'}
            {currentLang === 'en' && 'Explore the full catalog'}
            {currentLang === 'de' && 'Entdecken Sie den vollständigen Katalog'}
            {currentLang === 'fr' && 'Explorez le catalogue complet'}
            {currentLang === 'es' && 'Explora el catálogo completo'}
            {currentLang === 'pt' && 'Explore o catálogo completo'}
          </h2>
          <Link
            href="/products"
            className="inline-block px-8 py-4 rounded-xl font-semibold text-white text-lg transition-all hover:scale-105 shadow-xl"
            style={{
              backgroundColor: brandConfig.primaryColor
            }}
          >
            {currentLang === 'it' && 'Vai al Catalogo'}
            {currentLang === 'en' && 'Go to Catalog'}
            {currentLang === 'de' && 'Zum Katalog'}
            {currentLang === 'fr' && 'Aller au Catalogue'}
            {currentLang === 'es' && 'Ir al Catálogo'}
            {currentLang === 'pt' && 'Ir ao Catálogo'}
          </Link>
        </div>
      </section>
    </main>
  );
}
