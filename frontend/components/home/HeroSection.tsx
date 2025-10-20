'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useBrand } from '@/contexts/BrandContext';
import { ArrowRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export default function HeroSection() {
  const { currentLang } = useLanguage();
  const { currentBrand, brandConfig, setBrand } = useBrand();

  // Contenuti Hero per ogni brand estratti da WordPress
  const brandHeroContent: Record<string, any> = {
    group: {
      badge: 'Dal 1982 nelle Dolomiti',
      title: 'Didieffeb2b Group',
      subtitle: 'Ferramenta e accessori per serramenti',
      description: 'Il gruppo leader nella produzione di maniglie e ferramenta per infissi con oltre 40 anni di esperienza. Made in Italy 100%.',
      bgImage: '/images/hero/didieffe.jpg'
    },
    didieffe: {
      badge: 'Dal 1982',
      title: 'Didieffe',
      subtitle: 'Dal concetto al prodotto',
      description: 'Produttori di maniglie e ferramenta per infissi. Trasformiamo la sapienza artigiana in efficienza industriale senza tradirne i principi.',
      bgImage: '/images/hero/didieffe.jpg'
    },
    antologia: {
      badge: 'Dal 1982',
      title: 'Antologia Classica',
      subtitle: 'The timeless elegance of handcrafted handles',
      description: 'Un omaggio all\'eleganza delle forme antiche. Maniglie forgiate in ferro e ottone, materie vive e sincere. Ogni pezzo nasce dalle mani di artigiani italiani.',
      bgImage: '/images/hero/antologia-hero.jpg'
    },
    hnox: {
      badge: 'Acciaio Inossidabile',
      title: 'Hìnox',
      subtitle: 'Sfida la corrosione e il tempo',
      description: 'Ferramenta per persiane in acciaio inox AISI 304 e 316. Soluzioni progettate per tutti i tipi di sistemi oscuranti.',
      bgImage: '/images/hero/hnox.jpg'
    },
    xtrend: {
      badge: 'Design Made Ideas',
      title: 'X-Trend',
      subtitle: 'The Handles of Design',
      description: 'Tecnologia industriale incontra flessibilità artigianale. Limited-run customized products per trasformare il design in realtà.',
      bgImage: '/images/hero/xtrend.jpg'
    }
  };

  const content = brandHeroContent[currentBrand];

  // Se siamo su "group", mostra griglia dei 4 brand invece dell'hero
  if (currentBrand === 'group') {
    return (
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.02)_1px,transparent_0)] bg-[size:40px_40px]" />

        <div className="relative z-10 container mx-auto px-4 py-32">
          {/* Group Title */}
          <div className="text-center mb-16">
            <div className="mb-8">
              <div className="inline-flex items-center gap-3 border border-emerald-600 rounded-full px-6 py-3 shadow-lg bg-emerald-50">
                <div className="w-2.5 h-2.5 rounded-full animate-pulse bg-emerald-600" />
                <span className="text-sm font-semibold tracking-wide text-emerald-700">
                  {content.badge}
                </span>
              </div>
            </div>

            {/* Logo Didieffe Group */}
            <div className="mb-8 flex justify-center">
              <img
                src={brandConfig.logo}
                alt="Didieffe Group"
                className="h-20 sm:h-24 md:h-32 w-auto"
              />
            </div>

            <p className="text-2xl md:text-3xl mb-4 text-emerald-700 font-bold">
              {content.subtitle}
            </p>

            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto">
              {content.description}
            </p>
          </div>

          {/* Grid dei 4 Brand - 2x2 layout come WordPress */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Didieffe */}
            <div
              onClick={() => setBrand('didieffe')}
              className="group relative overflow-hidden rounded-lg cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-2xl"
            >
              <img
                src="/images/brands/didieffe-home.jpg"
                alt="Didieffe"
                className="w-full h-auto"
              />
            </div>

            {/* Antologia Classica */}
            <div
              onClick={() => setBrand('antologia')}
              className="group relative overflow-hidden rounded-lg cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-2xl"
            >
              <img
                src="/images/brands/antologia-home.jpg"
                alt="Antologia Classica"
                className="w-full h-auto"
              />
            </div>

            {/* X-Trend */}
            <div
              onClick={() => setBrand('xtrend')}
              className="group relative overflow-hidden rounded-lg cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-2xl"
            >
              <img
                src="/images/brands/xtrend-home.jpg"
                alt="X-Trend"
                className="w-full h-auto"
              />
            </div>

            {/* Hìnox */}
            <div
              onClick={() => setBrand('hnox')}
              className="group relative overflow-hidden rounded-lg cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-2xl"
            >
              <img
                src="/images/brands/hnox-home.jpg"
                alt="Hìnox"
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center mt-16">
            <Link
              href="/products"
              className="inline-flex items-center gap-4 text-white px-12 py-6 rounded-xl font-bold text-lg transition-all hover:scale-105 bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-xl hover:shadow-2xl"
            >
              <span>
                {currentLang === 'it' && 'Esplora Tutti i Prodotti'}
                {currentLang === 'en' && 'Explore All Products'}
                {currentLang === 'de' && 'Alle Produkte entdecken'}
                {currentLang === 'fr' && 'Explorer Tous les Produits'}
                {currentLang === 'es' && 'Explorar Todos los Productos'}
                {currentLang === 'pt' && 'Explorar Todos os Produtos'}
              </span>
              <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // Hero normale per gli altri brand
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Hero Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
        style={{
          backgroundImage: `url(${content.bgImage})`
        }}
      />

      {/* Dark Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />

      {/* Brand Color Gradient Overlay */}
      <div
        className="absolute inset-0 transition-all duration-1000 mix-blend-overlay"
        style={{
          background: `linear-gradient(135deg, transparent 0%, ${brandConfig.primaryColor}20 50%, ${brandConfig.secondaryColor}20 100%)`
        }}
      />

      {/* Subtle Animated Blobs */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute top-0 -left-4 w-[600px] h-[600px] rounded-full filter blur-3xl opacity-30 animate-blob"
          style={{ background: brandConfig.primaryColor }}
        />
        <div
          className="absolute top-0 -right-4 w-[600px] h-[600px] rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-2000"
          style={{ background: brandConfig.secondaryColor }}
        />
      </div>

      {/* Subtle Dot Pattern for texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)] bg-[size:40px_40px]" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center py-32">
        {/* Floating Badge */}
        <div className="mb-8 animate-float">
          <div
            className="inline-flex items-center gap-3 backdrop-blur-xl border rounded-full px-6 py-3 shadow-2xl hover:scale-105 transition-transform duration-300"
            style={{
              backgroundColor: `${brandConfig.primaryColor}10`,
              borderColor: `${brandConfig.primaryColor}30`,
              boxShadow: `0 10px 40px ${brandConfig.primaryColor}20`
            }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: brandConfig.primaryColor }}
            />
            <span className="text-sm font-semibold tracking-wide" style={{ color: brandConfig.secondaryColor }}>
              {content.badge}
            </span>
          </div>
        </div>

        {/* Main Title with Gradient */}
        <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black mb-8 leading-[0.9] tracking-tight">
          <span
            className="block bg-clip-text text-transparent animate-gradient bg-300%"
            style={{
              backgroundImage: `linear-gradient(135deg, #ffffff 0%, ${brandConfig.secondaryColor} 50%, ${brandConfig.primaryColor} 100%)`
            }}
          >
            {content.title}
          </span>
        </h1>

        {/* Subtitle with Typewriter Effect */}
        <p
          className="text-2xl md:text-3xl lg:text-4xl mb-6 max-w-4xl mx-auto font-bold tracking-tight"
          style={{
            color: brandConfig.secondaryColor,
            textShadow: `0 0 60px ${brandConfig.primaryColor}40`
          }}
        >
          {content.subtitle}
        </p>

        <p className="text-lg md:text-xl text-gray-400 mb-14 max-w-3xl mx-auto leading-relaxed font-light">
          {content.description}
        </p>

        {/* Premium CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
          <Link
            href="/products"
            className="group relative overflow-hidden text-white px-12 py-6 rounded-2xl font-bold text-lg transition-all flex items-center gap-4 hover:scale-105 hover:-translate-y-1"
            style={{
              background: `linear-gradient(135deg, ${brandConfig.primaryColor} 0%, ${brandConfig.secondaryColor} 100%)`,
              boxShadow: `0 20px 60px -15px ${brandConfig.primaryColor}60, 0 0 0 1px ${brandConfig.primaryColor}40 inset`
            }}
          >
            {/* Shimmer Effect */}
            <div
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
              }}
            />
            <span className="relative z-10">
              {currentLang === 'it' && 'Scopri il Catalogo'}
              {currentLang === 'en' && 'Discover Catalog'}
              {currentLang === 'de' && 'Katalog entdecken'}
              {currentLang === 'fr' && 'Découvrir le Catalogue'}
              {currentLang === 'es' && 'Descubrir Catálogo'}
              {currentLang === 'pt' && 'Descobrir Catálogo'}
            </span>
            <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
          </Link>

          <Link
            href="/about"
            className="group relative overflow-hidden backdrop-blur-xl text-white px-12 py-6 rounded-2xl font-bold text-lg transition-all flex items-center gap-4 hover:scale-105 hover:-translate-y-1"
            style={{
              backgroundColor: `${brandConfig.primaryColor}15`,
              border: `2px solid ${brandConfig.primaryColor}40`,
              boxShadow: `0 10px 40px -15px ${brandConfig.primaryColor}40`
            }}
          >
            <span className="relative z-10">
              {currentLang === 'it' && 'Chi Siamo'}
              {currentLang === 'en' && 'About Us'}
              {currentLang === 'de' && 'Über Uns'}
              {currentLang === 'fr' && 'À Propos'}
              {currentLang === 'es' && 'Quiénes Somos'}
              {currentLang === 'pt' && 'Quem Somos'}
            </span>
            {/* Hover Glow */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
              style={{ background: `${brandConfig.primaryColor}30` }}
            />
          </Link>
        </div>

        {/* Premium Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <div
            className="group relative backdrop-blur-xl rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:-translate-y-2"
            style={{
              backgroundColor: `${brandConfig.primaryColor}08`,
              border: `1px solid ${brandConfig.primaryColor}20`,
              boxShadow: `0 10px 30px -10px ${brandConfig.primaryColor}30`
            }}
          >
            <div
              className="text-5xl md:text-6xl font-black mb-3 bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${brandConfig.secondaryColor}, ${brandConfig.primaryColor})`
              }}
            >
              40+
            </div>
            <div className="text-xs md:text-sm text-gray-400 uppercase tracking-widest font-semibold">
              {currentLang === 'it' && 'Anni'}
              {currentLang === 'en' && 'Years'}
              {currentLang === 'de' && 'Jahre'}
              {currentLang === 'fr' && 'Ans'}
              {currentLang === 'es' && 'Años'}
              {currentLang === 'pt' && 'Anos'}
            </div>
          </div>

          <div
            className="group relative backdrop-blur-xl rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:-translate-y-2"
            style={{
              backgroundColor: `${brandConfig.primaryColor}08`,
              border: `1px solid ${brandConfig.primaryColor}20`,
              boxShadow: `0 10px 30px -10px ${brandConfig.primaryColor}30`
            }}
          >
            <div
              className="text-5xl md:text-6xl font-black mb-3 bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${brandConfig.secondaryColor}, ${brandConfig.primaryColor})`
              }}
            >
              100%
            </div>
            <div className="text-xs md:text-sm text-gray-400 uppercase tracking-widest font-semibold">
              Made in Italy
            </div>
          </div>

          <div
            className="group relative backdrop-blur-xl rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:-translate-y-2"
            style={{
              backgroundColor: `${brandConfig.primaryColor}08`,
              border: `1px solid ${brandConfig.primaryColor}20`,
              boxShadow: `0 10px 30px -10px ${brandConfig.primaryColor}30`
            }}
          >
            <div
              className="text-5xl md:text-6xl font-black mb-3 bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${brandConfig.secondaryColor}, ${brandConfig.primaryColor})`
              }}
            >
              24h
            </div>
            <div className="text-xs md:text-sm text-gray-400 uppercase tracking-widest font-semibold">
              {currentLang === 'it' && 'Spedizione'}
              {currentLang === 'en' && 'Shipping'}
              {currentLang === 'de' && 'Versand'}
              {currentLang === 'fr' && 'Livraison'}
              {currentLang === 'es' && 'Envío'}
              {currentLang === 'pt' && 'Envio'}
            </div>
          </div>

          <div
            className="group relative backdrop-blur-xl rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:-translate-y-2"
            style={{
              backgroundColor: `${brandConfig.primaryColor}08`,
              border: `1px solid ${brandConfig.primaryColor}20`,
              boxShadow: `0 10px 30px -10px ${brandConfig.primaryColor}30`
            }}
          >
            <div
              className="text-5xl md:text-6xl font-black mb-3 bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${brandConfig.secondaryColor}, ${brandConfig.primaryColor})`
              }}
            >
              ISO
            </div>
            <div className="text-xs md:text-sm text-gray-400 uppercase tracking-widest font-semibold">
              {currentLang === 'it' && 'Certificati'}
              {currentLang === 'en' && 'Certified'}
              {currentLang === 'de' && 'Zertifiziert'}
              {currentLang === 'fr' && 'Certifié'}
              {currentLang === 'es' && 'Certificado'}
              {currentLang === 'pt' && 'Certificado'}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400 animate-bounce">
        <span className="text-xs uppercase tracking-wider">
          {currentLang === 'it' && 'Scorri'}
          {currentLang === 'en' && 'Scroll'}
          {currentLang === 'de' && 'Scrollen'}
          {currentLang === 'fr' && 'Défiler'}
          {currentLang === 'es' && 'Desplazar'}
          {currentLang === 'pt' && 'Rolar'}
        </span>
        <ChevronDown className="w-5 h-5" />
      </div>
    </section>
  );
}
