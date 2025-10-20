'use client';

import { useBrand } from '@/contexts/BrandContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { FileText, Download as DownloadIcon, Award, Book, FileSpreadsheet } from 'lucide-react';
import downloadsData from '@/data/downloads.json';

export default function DownloadPage() {
  const { brandConfig } = useBrand();
  const { currentLang } = useLanguage();

  // Mappa delle categorie con metadati UI
  const categoryMetadata: Record<string, any> = {
    cataloghi: {
      icon: Book,
      title: {
        it: 'Cataloghi',
        en: 'Catalogs',
        de: 'Kataloge',
        fr: 'Catalogues',
        es: 'Catálogos',
        pt: 'Catálogos'
      },
      description: {
        it: 'Scarica i nostri cataloghi prodotti in formato PDF',
        en: 'Download our product catalogs in PDF format',
        de: 'Laden Sie unsere Produktkataloge im PDF-Format herunter',
        fr: 'Téléchargez nos catalogues de produits au format PDF',
        es: 'Descargue nuestros catálogos de productos en formato PDF',
        pt: 'Baixe nossos catálogos de produtos em formato PDF'
      }
    },
    'schede-tecniche': {
      icon: FileText,
      title: {
        it: 'Schede Tecniche',
        en: 'Technical Sheets',
        de: 'Technische Datenblätter',
        fr: 'Fiches Techniques',
        es: 'Fichas Técnicas',
        pt: 'Fichas Técnicas'
      },
      description: {
        it: 'Documentazione tecnica dettagliata dei prodotti',
        en: 'Detailed technical documentation of products',
        de: 'Detaillierte technische Dokumentation der Produkte',
        fr: 'Documentation technique détaillée des produits',
        es: 'Documentación técnica detallada de los productos',
        pt: 'Documentação técnica detalhada dos produtos'
      }
    },
    certificazioni: {
      icon: Award,
      title: {
        it: 'Certificazioni',
        en: 'Certifications',
        de: 'Zertifizierungen',
        fr: 'Certifications',
        es: 'Certificaciones',
        pt: 'Certificações'
      },
      description: {
        it: 'Certificati di qualità e conformità',
        en: 'Quality and compliance certificates',
        de: 'Qualitäts- und Konformitätszertifikate',
        fr: 'Certificats de qualité et de conformité',
        es: 'Certificados de calidad y conformidad',
        pt: 'Certificados de qualidade e conformidade'
      }
    },
    documentazione: {
      icon: FileSpreadsheet,
      title: {
        it: 'Documentazione Tecnica',
        en: 'Technical Documentation',
        de: 'Technische Dokumentation',
        fr: 'Documentation Technique',
        es: 'Documentación Técnica',
        pt: 'Documentação Técnica'
      },
      description: {
        it: 'Manuali di installazione e manutenzione',
        en: 'Installation and maintenance manuals',
        de: 'Installations- und Wartungshandbücher',
        fr: 'Manuels d\'installation et d\'entretien',
        es: 'Manuales de instalación y mantenimiento',
        pt: 'Manuais de instalação e manutenção'
      }
    }
  };

  // Costruisci le categorie combinando dati JSON e metadati UI
  const downloadCategories = Object.entries(downloadsData).map(([categoryKey, files]) => ({
    key: categoryKey,
    ...categoryMetadata[categoryKey],
    files
  }));

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
            <DownloadIcon className="w-10 h-10" />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Download
          </h1>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {currentLang === 'it' && 'Scarica cataloghi, schede tecniche, certificazioni e documentazione'}
            {currentLang === 'en' && 'Download catalogs, technical sheets, certifications and documentation'}
            {currentLang === 'de' && 'Laden Sie Kataloge, Datenblätter, Zertifizierungen und Dokumentation herunter'}
            {currentLang === 'fr' && 'Téléchargez catalogues, fiches techniques, certifications et documentation'}
            {currentLang === 'es' && 'Descargue catálogos, fichas técnicas, certificaciones y documentación'}
            {currentLang === 'pt' && 'Baixe catálogos, fichas técnicas, certificações e documentação'}
          </p>
        </div>
      </section>

      {/* Download Categories */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl space-y-12">
          {downloadCategories.map((category, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Category Header */}
              <div
                className="p-8 flex items-center gap-6"
                style={{ backgroundColor: `${brandConfig.primaryColor}10` }}
              >
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: brandConfig.primaryColor,
                    color: 'white'
                  }}
                >
                  <category.icon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {category.title[currentLang as keyof typeof category.title]}
                  </h2>
                  <p className="text-gray-600">
                    {category.description[currentLang as keyof typeof category.description]}
                  </p>
                </div>
              </div>

              {/* Files List */}
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.files.map((file: any, fileIndex: number) => (
                    <a
                      key={fileIndex}
                      href={`/api/download/${category.key}/${file.filename}`}
                      download
                      className="group flex items-center gap-4 p-6 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg bg-white"
                    >
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {file.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {file.format} • {file.size}
                        </p>
                      </div>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: `${brandConfig.primaryColor}20` }}
                      >
                        <DownloadIcon
                          className="w-5 h-5"
                          style={{ color: brandConfig.primaryColor }}
                        />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Info Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            {currentLang === 'it' && 'Hai bisogno di altro?'}
            {currentLang === 'en' && 'Need something else?'}
            {currentLang === 'de' && 'Benötigen Sie etwas anderes?'}
            {currentLang === 'fr' && 'Besoin d\'autre chose?'}
            {currentLang === 'es' && '¿Necesitas algo más?'}
            {currentLang === 'pt' && 'Precisa de algo mais?'}
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            {currentLang === 'it' && 'Per richiedere documentazione specifica o informazioni aggiuntive, contattaci'}
            {currentLang === 'en' && 'To request specific documentation or additional information, contact us'}
            {currentLang === 'de' && 'Um spezifische Dokumentation oder zusätzliche Informationen anzufordern, kontaktieren Sie uns'}
            {currentLang === 'fr' && 'Pour demander une documentation spécifique ou des informations supplémentaires, contactez-nous'}
            {currentLang === 'es' && 'Para solicitar documentación específica o información adicional, contáctenos'}
            {currentLang === 'pt' && 'Para solicitar documentação específica ou informações adicionais, entre em contato'}
          </p>
          <a
            href="/contact"
            className="inline-block px-8 py-4 rounded-xl font-semibold text-white text-lg transition-all hover:scale-105 shadow-xl"
            style={{
              backgroundColor: brandConfig.primaryColor
            }}
          >
            {currentLang === 'it' && 'Contattaci'}
            {currentLang === 'en' && 'Contact Us'}
            {currentLang === 'de' && 'Kontaktiere uns'}
            {currentLang === 'fr' && 'Contactez-nous'}
            {currentLang === 'es' && 'Contáctenos'}
            {currentLang === 'pt' && 'Entre em contato'}
          </a>
        </div>
      </section>
    </main>
  );
}
