'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Mountain, Award, Factory, Heart, Users, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function ChiSiamoPage() {
  const { currentLang } = useLanguage();

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1565008576549-57569a49371d?q=80&w=2000)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />

        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            {currentLang === 'it' && 'La Nostra Storia'}
            {currentLang === 'en' && 'Our Story'}
            {currentLang === 'de' && 'Unsere Geschichte'}
            {currentLang === 'fr' && 'Notre Histoire'}
            {currentLang === 'es' && 'Nuestra Historia'}
            {currentLang === 'pt' && 'Nossa História'}
          </h1>
          <p className="text-xl text-gray-200">
            {currentLang === 'it' && '40 anni di passione artigianale nelle Dolomiti'}
            {currentLang === 'en' && '40 years of artisan passion in the Dolomites'}
            {currentLang === 'de' && '40 Jahre handwerkliche Leidenschaft in den Dolomiten'}
            {currentLang === 'fr' && '40 ans de passion artisanale dans les Dolomites'}
            {currentLang === 'es' && '40 años de pasión artesanal en los Dolomitas'}
            {currentLang === 'pt' && '40 anos de paixão artesanal nos Dolomitas'}
          </p>
        </div>
      </section>

      {/* Storia Azienda */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {currentLang === 'it' && 'Dal 1985 nel cuore delle Dolomiti'}
              {currentLang === 'en' && 'Since 1985 in the heart of the Dolomites'}
              {currentLang === 'de' && 'Seit 1985 im Herzen der Dolomiten'}
              {currentLang === 'fr' && 'Depuis 1985 au cœur des Dolomites'}
              {currentLang === 'es' && 'Desde 1985 en el corazón de los Dolomitas'}
              {currentLang === 'pt' && 'Desde 1985 no coração dos Dolomitas'}
            </h2>

            {currentLang === 'it' && (
              <>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  La Didieffeb2b nasce nel 1985 dalla visione di <strong>Rolando</strong>, artigiano appassionato
                  con una profonda conoscenza della lavorazione dei metalli. Situata nel cuore delle Dolomiti,
                  patrimonio mondiale UNESCO, la nostra azienda rappresenta l'eccellenza della tradizione artigianale italiana.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  Dopo 40 anni di attività, Rolando continua a lavorare personalmente in azienda, supervisionando
                  ogni fase della produzione per garantire standard qualitativi assoluti. La sua dedizione e il suo
                  occhio attento ai dettagli sono il cuore pulsante della nostra filosofia aziendale.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Ogni prodotto che esce dal nostro laboratorio porta con sé 40 anni di esperienza, passione e
                  cura artigianale. Non siamo solo un'azienda, siamo custodi di una tradizione che si tramanda
                  e si rinnova ogni giorno.
                </p>
              </>
            )}

            {currentLang === 'en' && (
              <>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  Didieffeb2b was founded in 1985 from the vision of <strong>Rolando</strong>, a passionate artisan
                  with deep knowledge of metalworking. Located in the heart of the Dolomites, a UNESCO World Heritage
                  site, our company represents the excellence of Italian artisan tradition.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  After 40 years of activity, Rolando continues to work personally in the company, overseeing every
                  phase of production to ensure absolute quality standards. His dedication and keen eye for detail
                  are the beating heart of our company philosophy.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Every product that leaves our workshop carries with it 40 years of experience, passion, and artisan
                  care. We are not just a company, we are custodians of a tradition that is handed down and renewed
                  every day.
                </p>
              </>
            )}

            {(currentLang === 'de' || currentLang === 'fr' || currentLang === 'es' || currentLang === 'pt') && (
              <p className="text-lg text-gray-700 leading-relaxed">
                {currentLang === 'de' && 'Seit 1985 vertreten wir handwerkliche Exzellenz im Herzen der Dolomiten, einem UNESCO-Weltkulturerbe. Unser Gründer Rolando arbeitet noch heute persönlich im Unternehmen.'}
                {currentLang === 'fr' && 'Depuis 1985, nous représentons l\'excellence artisanale au cœur des Dolomites, patrimoine mondial de l\'UNESCO. Notre fondateur Rolando travaille encore personnellement dans l\'entreprise.'}
                {currentLang === 'es' && 'Desde 1985 representamos la excelencia artesanal en el corazón de los Dolomitas, Patrimonio de la Humanidad UNESCO. Nuestro fundador Rolando todavía trabaja personalmente en la empresa.'}
                {currentLang === 'pt' && 'Desde 1985 representamos a excelência artesanal no coração dos Dolomitas, Patrimônio Mundial da UNESCO. Nosso fundador Rolando ainda trabalha pessoalmente na empresa.'}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Valori Aziendali */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            {currentLang === 'it' && 'I Nostri Valori'}
            {currentLang === 'en' && 'Our Values'}
            {currentLang === 'de' && 'Unsere Werte'}
            {currentLang === 'fr' && 'Nos Valeurs'}
            {currentLang === 'es' && 'Nuestros Valores'}
            {currentLang === 'pt' && 'Nossos Valores'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Qualità */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <Award className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {currentLang === 'it' && 'Qualità Assoluta'}
                {currentLang === 'en' && 'Absolute Quality'}
                {currentLang === 'de' && 'Absolute Qualität'}
                {currentLang === 'fr' && 'Qualité Absolue'}
                {currentLang === 'es' && 'Calidad Absoluta'}
                {currentLang === 'pt' && 'Qualidade Absoluta'}
              </h3>
              <p className="text-gray-600">
                {currentLang === 'it' && 'Ogni prodotto è controllato personalmente da Rolando per garantire standard qualitativi superiori.'}
                {currentLang === 'en' && 'Every product is personally checked by Rolando to ensure superior quality standards.'}
                {currentLang === 'de' && 'Jedes Produkt wird persönlich von Rolando geprüft, um höchste Qualitätsstandards zu gewährleisten.'}
                {currentLang === 'fr' && 'Chaque produit est personnellement vérifié par Rolando pour garantir des standards de qualité supérieurs.'}
                {currentLang === 'es' && 'Cada producto es verificado personalmente por Rolando para garantizar estándares de calidad superiores.'}
                {currentLang === 'pt' && 'Cada produto é verificado pessoalmente por Rolando para garantir padrões de qualidade superiores.'}
              </p>
            </div>

            {/* Artigianalità */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Factory className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {currentLang === 'it' && 'Tradizione Artigianale'}
                {currentLang === 'en' && 'Artisan Tradition'}
                {currentLang === 'de' && 'Handwerkliche Tradition'}
                {currentLang === 'fr' && 'Tradition Artisanale'}
                {currentLang === 'es' && 'Tradición Artesanal'}
                {currentLang === 'pt' && 'Tradição Artesanal'}
              </h3>
              <p className="text-gray-600">
                {currentLang === 'it' && 'Lavorazione artigianale che unisce tecniche tradizionali e innovazione tecnologica.'}
                {currentLang === 'en' && 'Artisan craftsmanship that combines traditional techniques and technological innovation.'}
                {currentLang === 'de' && 'Handwerkliche Verarbeitung, die traditionelle Techniken und technologische Innovation vereint.'}
                {currentLang === 'fr' && 'Artisanat qui allie techniques traditionnelles et innovation technologique.'}
                {currentLang === 'es' && 'Artesanía que combina técnicas tradicionales e innovación tecnológica.'}
                {currentLang === 'pt' && 'Artesanato que combina técnicas tradicionais e inovação tecnológica.'}
              </p>
            </div>

            {/* Made in Dolomiti */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <Mountain className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Made in Dolomiti UNESCO
              </h3>
              <p className="text-gray-600">
                {currentLang === 'it' && 'Produciamo nel cuore delle Dolomiti, patrimonio mondiale UNESCO, simbolo di eccellenza italiana.'}
                {currentLang === 'en' && 'We produce in the heart of the Dolomites, UNESCO World Heritage, symbol of Italian excellence.'}
                {currentLang === 'de' && 'Wir produzieren im Herzen der Dolomiten, UNESCO-Weltkulturerbe, Symbol italienischer Exzellenz.'}
                {currentLang === 'fr' && 'Nous produisons au cœur des Dolomites, patrimoine mondial UNESCO, symbole d\'excellence italienne.'}
                {currentLang === 'es' && 'Producimos en el corazón de los Dolomitas, Patrimonio de la Humanidad UNESCO, símbolo de excelencia italiana.'}
                {currentLang === 'pt' && 'Produzimos no coração dos Dolomitas, Patrimônio Mundial da UNESCO, símbolo de excelência italiana.'}
              </p>
            </div>

            {/* Passione */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                <Heart className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {currentLang === 'it' && 'Passione'}
                {currentLang === 'en' && 'Passion'}
                {currentLang === 'de' && 'Leidenschaft'}
                {currentLang === 'fr' && 'Passion'}
                {currentLang === 'es' && 'Pasión'}
                {currentLang === 'pt' && 'Paixão'}
              </h3>
              <p className="text-gray-600">
                {currentLang === 'it' && '40 anni di amore per il nostro lavoro, dedicando ogni giorno cura e attenzione ai nostri prodotti.'}
                {currentLang === 'en' && '40 years of love for our work, dedicating care and attention to our products every day.'}
                {currentLang === 'de' && '40 Jahre Liebe zu unserer Arbeit, jeden Tag Sorgfalt und Aufmerksamkeit für unsere Produkte.'}
                {currentLang === 'fr' && '40 ans d\'amour pour notre travail, dédiant soin et attention à nos produits chaque jour.'}
                {currentLang === 'es' && '40 años de amor por nuestro trabajo, dedicando cuidado y atención a nuestros productos cada día.'}
                {currentLang === 'pt' && '40 anos de amor pelo nosso trabalho, dedicando cuidado e atenção aos nossos produtos todos os dias.'}
              </p>
            </div>

            {/* Cliente al Centro */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {currentLang === 'it' && 'Cliente al Centro'}
                {currentLang === 'en' && 'Customer First'}
                {currentLang === 'de' && 'Kunde im Mittelpunkt'}
                {currentLang === 'fr' && 'Client au Centre'}
                {currentLang === 'es' && 'Cliente Primero'}
                {currentLang === 'pt' && 'Cliente em Primeiro Lugar'}
              </h3>
              <p className="text-gray-600">
                {currentLang === 'it' && 'Ascoltiamo le esigenze dei nostri clienti per offrire soluzioni su misura e assistenza personalizzata.'}
                {currentLang === 'en' && 'We listen to our customers\' needs to offer tailored solutions and personalized assistance.'}
                {currentLang === 'de' && 'Wir hören auf die Bedürfnisse unserer Kunden, um maßgeschneiderte Lösungen und persönliche Betreuung anzubieten.'}
                {currentLang === 'fr' && 'Nous écoutons les besoins de nos clients pour offrir des solutions sur mesure et une assistance personnalisée.'}
                {currentLang === 'es' && 'Escuchamos las necesidades de nuestros clientes para ofrecer soluciones personalizadas y asistencia personalizada.'}
                {currentLang === 'pt' && 'Ouvimos as necessidades dos nossos clientes para oferecer soluções personalizadas e assistência personalizada.'}
              </p>
            </div>

            {/* Affidabilità */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <Truck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {currentLang === 'it' && 'Affidabilità'}
                {currentLang === 'en' && 'Reliability'}
                {currentLang === 'de' && 'Zuverlässigkeit'}
                {currentLang === 'fr' && 'Fiabilité'}
                {currentLang === 'es' && 'Fiabilidad'}
                {currentLang === 'pt' && 'Confiabilidade'}
              </h3>
              <p className="text-gray-600">
                {currentLang === 'it' && 'Consegne puntuali, prodotti sempre disponibili e assistenza post-vendita di qualità.'}
                {currentLang === 'en' && 'Punctual deliveries, products always available and quality after-sales service.'}
                {currentLang === 'de' && 'Pünktliche Lieferungen, immer verfügbare Produkte und qualitativ hochwertiger Kundendienst.'}
                {currentLang === 'fr' && 'Livraisons ponctuelles, produits toujours disponibles et service après-vente de qualité.'}
                {currentLang === 'es' && 'Entregas puntuales, productos siempre disponibles y servicio postventa de calidad.'}
                {currentLang === 'pt' && 'Entregas pontuais, produtos sempre disponíveis e serviço pós-venda de qualidade.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Certificazioni */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            {currentLang === 'it' && 'Certificazioni e Riconoscimenti'}
            {currentLang === 'en' && 'Certifications and Awards'}
            {currentLang === 'de' && 'Zertifizierungen und Auszeichnungen'}
            {currentLang === 'fr' && 'Certifications et Récompenses'}
            {currentLang === 'es' && 'Certificaciones y Reconocimientos'}
            {currentLang === 'pt' && 'Certificações e Reconhecimentos'}
          </h2>

          <div className="flex flex-col md:flex-row items-center justify-center gap-12">
            <div className="text-center">
              <Image
                src="https://shop.didieffeb2b.com/admin/data/Made_in_dolomiti.jpg"
                alt="Made in Dolomiti"
                width={120}
                height={120}
                className="mx-auto mb-4"
              />
              <h3 className="font-bold text-gray-900 mb-2">Made in Dolomiti</h3>
              <p className="text-gray-600">UNESCO World Heritage</p>
            </div>

            <div className="text-center">
              <Image
                src="https://shop.didieffeb2b.com/admin/data/rolando_quality.jpg"
                alt="Rolando Quality"
                width={120}
                height={120}
                className="mx-auto mb-4"
              />
              <h3 className="font-bold text-gray-900 mb-2">Rolando Quality</h3>
              <p className="text-gray-600">
                {currentLang === 'it' && 'Controllo Qualità Personale'}
                {currentLang === 'en' && 'Personal Quality Control'}
                {currentLang === 'de' && 'Persönliche Qualitätskontrolle'}
                {currentLang === 'fr' && 'Contrôle Qualité Personnel'}
                {currentLang === 'es' && 'Control de Calidad Personal'}
                {currentLang === 'pt' && 'Controle de Qualidade Pessoal'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-green-600 to-green-700">
        <div className="container mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {currentLang === 'it' && 'Scopri i Nostri Prodotti'}
            {currentLang === 'en' && 'Discover Our Products'}
            {currentLang === 'de' && 'Entdecken Sie Unsere Produkte'}
            {currentLang === 'fr' && 'Découvrez Nos Produits'}
            {currentLang === 'es' && 'Descubre Nuestros Productos'}
            {currentLang === 'pt' && 'Descubra Nossos Produtos'}
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            {currentLang === 'it' && 'Esplora il nostro catalogo e trova la soluzione perfetta per le tue esigenze'}
            {currentLang === 'en' && 'Explore our catalog and find the perfect solution for your needs'}
            {currentLang === 'de' && 'Erkunden Sie unseren Katalog und finden Sie die perfekte Lösung für Ihre Bedürfnisse'}
            {currentLang === 'fr' && 'Explorez notre catalogue et trouvez la solution parfaite pour vos besoins'}
            {currentLang === 'es' && 'Explora nuestro catálogo y encuentra la solución perfecta para tus necesidades'}
            {currentLang === 'pt' && 'Explore nosso catálogo e encontre a solução perfeita para suas necessidades'}
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-white text-green-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-xl hover:shadow-2xl hover:scale-105"
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
