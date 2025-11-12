'use client';

import { useBrand, brandConfigs, type Brand } from '@/contexts/BrandContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCatalogText, Language } from '@/lib/catalog-translations';
import Link from 'next/link';
import { ArrowRight, Building2, Sparkles, Package } from 'lucide-react';

export default function BrandShowcase() {
  const { currentBrand, setBrand } = useBrand();
  const { currentLang } = useLanguage();

  // Non mostrare questa sezione per il brand "group"
  if (currentBrand === 'group') {
    return null;
  }

  const brands: Array<{ id: Brand; icon: React.ReactNode; tagline: Record<string, string> }> = [
    {
      id: 'didieffe',
      icon: <Package className="w-12 h-12" />,
      tagline: {
        it: 'Ferramenta di qualità per serramenti',
        en: 'Quality hardware for windows and doors',
        de: 'Qualitätsbeschläge für Fenster und Türen',
        fr: 'Quincaillerie de qualité pour fenêtres',
        es: 'Herrajes de calidad para ventanas',
        pt: 'Ferragens de qualidade para janelas'
      }
    },
    {
      id: 'antologia',
      icon: <Sparkles className="w-12 h-12" />,
      tagline: {
        it: 'Eleganza classica senza tempo',
        en: 'Timeless classic elegance',
        de: 'Zeitlose klassische Eleganz',
        fr: 'Élégance classique intemporelle',
        es: 'Elegancia clásica atemporal',
        pt: 'Elegância clássica atemporal'
      }
    },
    {
      id: 'hnox',
      icon: <Building2 className="w-12 h-12" />,
      tagline: {
        it: 'Acciaio inox per persiane',
        en: 'Stainless steel for shutters',
        de: 'Edelstahl für Fensterläden',
        fr: 'Acier inoxydable pour volets',
        es: 'Acero inoxidable para persianas',
        pt: 'Aço inoxidável para persianas'
      }
    },
    {
      id: 'xtrend',
      icon: <Sparkles className="w-12 h-12" />,
      tagline: {
        it: 'Design e innovazione',
        en: 'Design and innovation',
        de: 'Design und Innovation',
        fr: 'Design et innovation',
        es: 'Diseño e innovación',
        pt: 'Design e inovação'
      }
    }
  ];

  const getTitle = () => {
    switch (currentLang) {
      case 'en': return 'Our Brands';
      case 'de': return 'Unsere Marken';
      case 'fr': return 'Nos Marques';
      case 'es': return 'Nuestras Marcas';
      case 'pt': return 'Nossas Marcas';
      default: return 'I Nostri Brand';
    }
  };

  const getSubtitle = () => {
    switch (currentLang) {
      case 'en': return 'Specialized solutions for every need';
      case 'de': return 'Spezialisierte Lösungen für jeden Bedarf';
      case 'fr': return 'Solutions spécialisées pour chaque besoin';
      case 'es': return 'Soluciones especializadas para cada necesidad';
      case 'pt': return 'Soluções especializadas para cada necessidade';
      default: return 'Soluzioni specializzate per ogni esigenza';
    }
  };

  const getExploreLabel = () => {
    switch (currentLang) {
      case 'en': return 'Explore';
      case 'de': return 'Entdecken';
      case 'fr': return 'Explorer';
      case 'es': return 'Explorar';
      case 'pt': return 'Explorar';
      default: return 'Scopri';
    }
  };

  const getCurrentBrandLabel = () => {
    switch (currentLang) {
      case 'en': return 'Current Brand';
      case 'de': return 'Aktuelle Marke';
      case 'fr': return 'Marque Actuelle';
      case 'es': return 'Marca Actual';
      case 'pt': return 'Marca Atual';
      default: return 'Brand Corrente';
    }
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="w-8 h-8 text-emerald-600" />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
              {getTitle()}
            </h2>
          </div>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            {getSubtitle()}
          </p>
        </div>

        {/* Brand Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto">
          {brands.map((brand) => {
            const config = brandConfigs[brand.id];
            const isCurrent = currentBrand === brand.id;

            return (
              <div
                key={brand.id}
                className={`group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden ${
                  isCurrent
                    ? 'ring-4 ring-offset-4'
                    : 'hover:-translate-y-2'
                }`}
                style={{
                  ringColor: isCurrent ? config.primaryColor : 'transparent'
                }}
              >
                {/* Current Brand Badge */}
                {isCurrent && (
                  <div
                    className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold text-white z-10"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    ✓ {getCurrentBrandLabel()}
                  </div>
                )}

                {/* Card Content */}
                <div className="p-8">
                  {/* Icon */}
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
                    style={{
                      backgroundColor: `${config.primaryColor}15`,
                      color: config.primaryColor
                    }}
                  >
                    {brand.icon}
                  </div>

                  {/* Brand Name */}
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                    {config.name}
                  </h3>

                  {/* Tagline */}
                  <p className="text-gray-600 mb-6 min-h-[3rem]">
                    {brand.tagline[currentLang] || brand.tagline.it}
                  </p>

                  {/* Description */}
                  <p className="text-sm text-gray-500 mb-6">
                    {config.description}
                  </p>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setBrand(brand.id)}
                      className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 group/btn"
                      style={{
                        backgroundColor: config.primaryColor,
                        color: 'white'
                      }}
                    >
                      <span>{getExploreLabel()}</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>

                    <Link
                      href="/products"
                      onClick={() => setBrand(brand.id)}
                      className="flex-1 px-6 py-3 rounded-xl font-semibold border-2 transition-all flex items-center justify-center gap-2 hover:bg-gray-50"
                      style={{
                        borderColor: config.primaryColor,
                        color: config.primaryColor
                      }}
                    >
                      Catalogo
                    </Link>
                  </div>
                </div>

                {/* Decorative Element */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-2"
                  style={{ backgroundColor: config.primaryColor }}
                />
              </div>
            );
          })}
        </div>

        {/* Group Description - Always visible */}
        <div className="mt-12 md:mt-16 bg-white rounded-2xl shadow-lg p-8 md:p-12 max-w-4xl mx-auto border-t-4 border-emerald-600">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {brandConfigs.group.fullName}
              </h3>
              <p className="text-emerald-600 font-semibold">
                {brandConfigs.group.description}
              </p>
            </div>
          </div>

          <div className="prose prose-lg max-w-none text-gray-600">
            <p>
              {getCatalogText('brandDescription', currentLang as Language)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
