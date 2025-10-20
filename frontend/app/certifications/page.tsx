'use client';

import { useBrand } from '@/contexts/BrandContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Award, CheckCircle, Download } from 'lucide-react';

export default function CertificationsPage() {
  const { brandConfig } = useBrand();
  const { currentLang } = useLanguage();

  const certifications = [
    {
      id: 'iso-9001',
      title: 'ISO 9001:2015',
      subtitle: {
        it: 'Sistema di Gestione Qualità',
        en: 'Quality Management System',
        de: 'Qualitätsmanagementsystem',
        fr: 'Système de Gestion de la Qualité',
        es: 'Sistema de Gestión de Calidad',
        pt: 'Sistema de Gestão da Qualidade'
      },
      description: {
        it: 'Certificazione che attesta il nostro impegno per la qualità dei processi produttivi e la soddisfazione del cliente',
        en: 'Certification attesting our commitment to production process quality and customer satisfaction',
        de: 'Zertifizierung, die unser Engagement für Produktionsprozessqualität und Kundenzufriedenheit bestätigt',
        fr: 'Certification attestant de notre engagement pour la qualité des processus de production et la satisfaction client',
        es: 'Certificación que acredita nuestro compromiso con la calidad de los procesos productivos y la satisfacción del cliente',
        pt: 'Certificação que atesta nosso compromisso com a qualidade dos processos produtivos e satisfação do cliente'
      },
      icon: Award,
      color: '#059669'
    },
    {
      id: 'iso-14001',
      title: 'ISO 14001:2015',
      subtitle: {
        it: 'Sistema di Gestione Ambientale',
        en: 'Environmental Management System',
        de: 'Umweltmanagementsystem',
        fr: 'Système de Gestion Environnementale',
        es: 'Sistema de Gestión Ambiental',
        pt: 'Sistema de Gestão Ambiental'
      },
      description: {
        it: 'Certificazione che dimostra il nostro impegno per la sostenibilità ambientale e la riduzione dell\'impatto ecologico',
        en: 'Certification demonstrating our commitment to environmental sustainability and ecological impact reduction',
        de: 'Zertifizierung, die unser Engagement für ökologische Nachhaltigkeit und Reduzierung der Umweltauswirkungen zeigt',
        fr: 'Certification démontrant notre engagement pour la durabilité environnementale et la réduction de l\'impact écologique',
        es: 'Certificación que demuestra nuestro compromiso con la sostenibilidad ambiental y la reducción del impacto ecológico',
        pt: 'Certificação que demonstra nosso compromisso com a sustentabilidade ambiental e redução do impacto ecológico'
      },
      icon: CheckCircle,
      color: '#10b981'
    }
  ];

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
            <Award className="w-10 h-10" />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            {currentLang === 'it' && 'Certificazioni'}
            {currentLang === 'en' && 'Certifications'}
            {currentLang === 'de' && 'Zertifizierungen'}
            {currentLang === 'fr' && 'Certifications'}
            {currentLang === 'es' && 'Certificaciones'}
            {currentLang === 'pt' && 'Certificações'}
          </h1>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {currentLang === 'it' && 'La qualità e la sostenibilità certificata dei nostri processi produttivi'}
            {currentLang === 'en' && 'The certified quality and sustainability of our production processes'}
            {currentLang === 'de' && 'Die zertifizierte Qualität und Nachhaltigkeit unserer Produktionsprozesse'}
            {currentLang === 'fr' && 'La qualité et la durabilité certifiées de nos processus de production'}
            {currentLang === 'es' && 'La calidad y sostenibilidad certificada de nuestros procesos productivos'}
            {currentLang === 'pt' && 'A qualidade e sustentabilidade certificada de nossos processos produtivos'}
          </p>
        </div>
      </section>

      {/* Certifications Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {certifications.map((cert) => (
              <div
                key={cert.id}
                className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all hover:-translate-y-2"
              >
                <div
                  className="w-16 h-16 rounded-xl mb-6 flex items-center justify-center"
                  style={{
                    backgroundColor: `${cert.color}20`,
                    color: cert.color
                  }}
                >
                  <cert.icon className="w-8 h-8" />
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {cert.title}
                </h2>

                <p
                  className="text-lg font-semibold mb-4"
                  style={{ color: cert.color }}
                >
                  {cert.subtitle[currentLang as keyof typeof cert.subtitle]}
                </p>

                <p className="text-gray-600 mb-6 leading-relaxed">
                  {cert.description[currentLang as keyof typeof cert.description]}
                </p>

                <a
                  href={`/api/download/certificazioni/${cert.id}.pdf`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
                  style={{
                    backgroundColor: `${cert.color}15`,
                    color: cert.color
                  }}
                >
                  <Download className="w-5 h-5" />
                  {currentLang === 'it' && 'Scarica Certificato'}
                  {currentLang === 'en' && 'Download Certificate'}
                  {currentLang === 'de' && 'Zertifikat herunterladen'}
                  {currentLang === 'fr' && 'Télécharger le Certificat'}
                  {currentLang === 'es' && 'Descargar Certificado'}
                  {currentLang === 'pt' && 'Baixar Certificado'}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            {currentLang === 'it' && 'Il nostro impegno per l\'eccellenza'}
            {currentLang === 'en' && 'Our commitment to excellence'}
            {currentLang === 'de' && 'Unser Engagement für Exzellenz'}
            {currentLang === 'fr' && 'Notre engagement pour l\'excellence'}
            {currentLang === 'es' && 'Nuestro compromiso con la excelencia'}
            {currentLang === 'pt' && 'Nosso compromisso com a excelência'}
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            {currentLang === 'it' && 'Le nostre certificazioni ISO attestano il costante impegno per la qualità dei prodotti e il rispetto dell\'ambiente. Ogni fase della produzione è monitorata per garantire gli standard più elevati.'}
            {currentLang === 'en' && 'Our ISO certifications attest to our constant commitment to product quality and environmental respect. Every phase of production is monitored to ensure the highest standards.'}
            {currentLang === 'de' && 'Unsere ISO-Zertifizierungen belegen unser ständiges Engagement für Produktqualität und Umweltschutz. Jede Produktionsphase wird überwacht, um die höchsten Standards zu gewährleisten.'}
            {currentLang === 'fr' && 'Nos certifications ISO attestent de notre engagement constant pour la qualité des produits et le respect de l\'environnement. Chaque phase de production est surveillée pour garantir les normes les plus élevées.'}
            {currentLang === 'es' && 'Nuestras certificaciones ISO atestiguan el compromiso constante con la calidad de los productos y el respeto al medio ambiente. Cada fase de producción se monitorea para garantizar los más altos estándares.'}
            {currentLang === 'pt' && 'Nossas certificações ISO atestam nosso compromisso constante com a qualidade dos produtos e respeito ao meio ambiente. Cada fase da produção é monitorada para garantir os mais altos padrões.'}
          </p>
        </div>
      </section>
    </main>
  );
}
