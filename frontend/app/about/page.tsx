// app/about/page.tsx - Dynamic About Page Based on Current Brand
'use client';

import { useBrand } from '@/contexts/BrandContext';
import { Building2, Users, Award, Factory, Target, Heart } from 'lucide-react';

export default function AboutPage() {
  const { currentBrand, brandConfig } = useBrand();

  // Contenuti per ogni brand
  const brandContent: Record<string, any> = {
    group: {
      hero: {
        title: 'Didieffe Group',
        subtitle: 'Dal 1982 nelle Dolomiti Bellunesi',
        description: 'Il gruppo leader nella produzione di ferramenta e accessori per serramenti con oltre 40 anni di esperienza'
      },
      story: {
        title: 'Azienda',
        text: 'Alla base di Didieffe, fin dalle origini, nel 1982, c\'è la passione per un\'eccellenza artigiana tipica del nostro territorio: quella che vede lavorare uniti il fabbro e il falegname per creare ferramenta per serramenti, maniglie e elementi di decoro per mobili in legno. La lavorazione del metallo che prende avvio da questo connubio ha portato ad un processo creativo che, industrializzato, ha permesso a Didieffe di sviluppare una forte identità di prodotto, radicata nella tradizione, ma che ha saputo slegarsi da logiche artigiane per abbracciare l\'innovazione tecnologica.\n\nLa produzione attuale di Didieffe è fatta di accessori in ferro battuto - maniglie per porte e finestre, ferramenta per sistemi oscuranti (cerniere, cardini, catenacci, spagnolette, fermaimposte, ecc anche in acciaio inox), accessori per mobili. In tutto oltre 5000 articoli da catalogo, tutti progettati e realizzati internamente nel nostro stabilimento di Cesiomaggiore, nel cuore delle Dolomiti Bellunesi.\n\nOltre agli articoli standard, la flessibilità delle linee produttive Didieffe consente anche la personalizzazione per quanto concerne dimensioni e finiture e la realizzazione di prodotti su disegno del Cliente, secondo una modalità On Demand.'
      },
      values: [
        { icon: Factory, title: 'Produzione', text: 'Dal concetto al prodotto con Know-How e ciclo produttivo d\'eccellenza. Oltre 5000 articoli da catalogo' },
        { icon: Heart, title: 'Tradizione', text: 'Passione per l\'eccellenza artigiana dal 1982. Il fabbro e il falegname lavorano uniti' },
        { icon: Building2, title: 'Territorio', text: 'Stabilimento a Cesiomaggiore, nel cuore delle Dolomiti Bellunesi' },
        { icon: Award, title: 'On Demand', text: 'Personalizzazione dimensioni e finiture. Prodotti su disegno del Cliente' }
      ]
    },
    didieffe: {
      hero: {
        title: 'Didieffe',
        subtitle: 'Ferramenta di qualità per serramenti in legno dal 1982',
        description: 'Produttori di maniglie e ferramenta per infissi con quasi quarant\'anni di esperienza'
      },
      story: {
        title: 'Chi Siamo',
        text: 'Dal 1982 produttori di maniglie e ferramenta per infissi. In quasi quarant\'anni di attività abbiamo saputo esaltare una tradizione secolare. Il fabbro lavorava a fianco del falegname per creare un prodotto di perfetta sintesi tra la lavorazione del metallo e l\'arte del legno. Abbiamo trasformato la sapienza artigiana in efficienza industriale senza tradirne i principi.'
      },
      values: [
        { icon: Target, title: 'Produzione', text: 'Dal concetto al prodotto: un ciclo produttivo che nasce dall\'idea per tradursi in realtà' },
        { icon: Heart, title: 'Tradizione', text: 'Mantenere viva la produzione tradizionale artigianale della ferramenta' },
        { icon: Award, title: 'Made in Italy', text: '100% Made in Italy DOC: fascino del passato e tecnologia futura' },
        { icon: Building2, title: 'Storia', text: 'Dal 1982 a oggi: crescita armoniosa nel rispetto del territorio' }
      ]
    },
    antologia: {
      hero: {
        title: 'Antologia Classica',
        subtitle: 'The timeless elegance of handcrafted handles',
        description: 'Un omaggio all\'eleganza delle forme antiche. Maniglie forgiate in ferro e ottone, materie vive e sincere'
      },
      story: {
        title: 'Chi Siamo',
        text: 'Dal 1982 produttori di maniglie e ferramenta per infissi. In quasi quarant\'anni di attività abbiamo saputo esaltare una tradizione secolare. Il fabbro lavorava a fianco del falegname per creare un prodotto di perfetta sintesi tra la lavorazione del metallo e l\'arte del legno.\n\nAntologia Classica è un omaggio all\'eleganza delle forme antiche, un viaggio nel tempo attraverso maniglie forgiate in ferro e ottone, materie vive e sincere. Ogni pezzo nasce dalle mani di artigiani italiani, che trasformano il metallo in racconto: dettagli scolpiti, superfici piene di memoria, curve che evocano la bellezza dell\'autentico.\n\nPensata per ambienti dove la storia incontra il design, questa collezione restituisce valore al gesto quotidiano di aprire una porta rendendolo rituale, stile, emozione.'
      },
      values: [
        { icon: Heart, title: 'Artigianalità', text: 'Ogni pezzo nasce dalle mani di artigiani italiani che trasformano il metallo in racconto' },
        { icon: Target, title: 'Design', text: 'Pensata per ambienti dove la storia incontra il design contemporaneo' },
        { icon: Award, title: 'Qualità', text: 'ISO 9001:2015 e ISO 14001:2015 per qualità e sostenibilità' },
        { icon: Building2, title: 'Tradizione', text: 'Una tradizione secolare che continua a vivere ed evolversi con passione' }
      ]
    },
    hnox: {
      hero: {
        title: 'Hìnox',
        subtitle: 'Ferramenta per persiane in acciaio inox',
        description: 'Soluzioni in acciaio inossidabile per resistere alla corrosione e al tempo'
      },
      story: {
        title: 'La Nostra Missione',
        text: 'Hìnox® significa sviluppo di soluzioni specificamente progettate per l\'applicazione su tutti i tipi di sistemi oscuranti. Nulla è lasciato al caso, Hìnox® è applicabile ovunque. Specializzati in ferramenta per persiane in acciaio inox AISI 304 e 316, garantiamo resistenza alla corrosione, durabilità ed estetica.'
      },
      values: [
        { icon: Award, title: 'Acciaio Inox', text: 'AISI 304 e 316: massima resistenza alla corrosione in ogni ambiente' },
        { icon: Target, title: 'Applicazioni', text: 'Soluzioni per zone marine, ambienti umidi e persiane di design' },
        { icon: Factory, title: 'On Demand', text: 'Prodotti personalizzati e modifiche su misura per ogni esigenza' },
        { icon: Building2, title: 'Made in Italy', text: 'Progettati e realizzati in Italia con acciaio certificato' }
      ]
    },
    xtrend: {
      hero: {
        title: 'X-Trend',
        subtitle: 'Design Made Ideas',
        description: 'The handles of design: dove la tecnologia industriale incontra la flessibilità artigianale'
      },
      story: {
        title: 'Our Vision',
        text: 'The growing demand for limited-run customized products is what inspired the birth of X-Trend, an innovative project that combines the technology of a product made by industrial methods with the flexibility typical of craftsmanship excellence. The result is handles and hardware for furniture, doors and windows that make a Client\'s design a reality.'
      },
      values: [
        { icon: Heart, title: 'Design', text: 'Maniglie che sono veri elementi distintivi: funzionalità ed estetica contemporanea' },
        { icon: Target, title: 'Innovazione', text: 'Ricerca e sviluppo per anticipare le tendenze del mercato' },
        { icon: Award, title: 'Customization', text: 'X-Trend on demand: libertà totale di personalizzazione del prodotto' },
        { icon: Building2, title: 'Tecnologia', text: 'Cuore tecnologico avanzato con viti autofilettanti e molle auto-regolanti' }
      ]
    }
  };

  const content = brandContent[currentBrand];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section
        className="relative py-32 px-4"
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
            <Building2 className="w-10 h-10" />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            {content.hero.title}
          </h1>

          <p
            className="text-2xl md:text-3xl font-semibold mb-6"
            style={{ color: brandConfig.primaryColor }}
          >
            {content.hero.subtitle}
          </p>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {content.hero.description}
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Logo per brand group, altrimenti testo a sinistra */}
            {currentBrand === 'group' ? (
              <>
                <div className="flex items-center justify-center">
                  <img
                    src="/images/logos/didieffe-group-large.png"
                    alt="Didieffe Group"
                    className="w-full max-w-md h-auto"
                  />
                </div>
                <div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-6">
                    {content.story.title}
                  </h2>
                  <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">
                    {content.story.text}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-6">
                    {content.story.title}
                  </h2>
                  <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">
                    {content.story.text}
                  </p>
                </div>

                {currentBrand === 'antologia' ? (
                  <div className="h-96 rounded-2xl overflow-hidden">
                    <img
                      src="/images/brands/antologia-azienda.jpg"
                      alt="Antologia Classica"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="h-96 rounded-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${brandConfig.primaryColor}30, ${brandConfig.secondaryColor}30)`
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section
        className="py-20 px-4"
        style={{ backgroundColor: '#f9fafb' }}
      >
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            I Nostri Valori
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {content.values.map((value: any, index: number) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2"
              >
                <div
                  className="w-16 h-16 rounded-xl mb-6 flex items-center justify-center"
                  style={{
                    backgroundColor: `${brandConfig.primaryColor}15`,
                    color: brandConfig.primaryColor
                  }}
                >
                  <value.icon className="w-8 h-8" />
                </div>

                <h3
                  className="text-xl font-bold mb-3"
                  style={{ color: brandConfig.primaryColor }}
                >
                  {value.title}
                </h3>

                <p className="text-gray-600">
                  {value.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Vuoi saperne di più?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Scopri i nostri prodotti e trova la soluzione perfetta per le tue esigenze
          </p>
          <a
            href="/products"
            className="inline-block px-8 py-4 rounded-xl font-semibold text-white text-lg transition-all hover:scale-105 shadow-xl"
            style={{
              backgroundColor: brandConfig.primaryColor
            }}
          >
            Esplora il Catalogo
          </a>
        </div>
      </section>
    </main>
  );
}
