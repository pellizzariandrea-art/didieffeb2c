'use client';

import { useBrand } from '@/contexts/BrandContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  const { brandConfig } = useBrand();
  const { currentLang } = useLanguage();

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
            <Shield className="w-10 h-10" />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {currentLang === 'it' && 'Informativa sul trattamento dei dati personali'}
            {currentLang === 'en' && 'Information on personal data processing'}
            {currentLang === 'de' && 'Informationen zur Verarbeitung personenbezogener Daten'}
            {currentLang === 'fr' && 'Informations sur le traitement des données personnelles'}
            {currentLang === 'es' && 'Información sobre el tratamiento de datos personales'}
            {currentLang === 'pt' && 'Informações sobre o tratamento de dados pessoais'}
          </p>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 prose prose-lg max-w-none">
            <h2>Informativa Privacy ai sensi del GDPR (Regolamento UE 2016/679)</h2>

            <p>
              La presente informativa descrive le modalità di trattamento dei dati personali degli utenti che consultano il sito {brandConfig.domain}.
            </p>

            <h3>1. Titolare del Trattamento</h3>
            <p>
              <strong>DIDIEFFE GROUP Srl</strong><br />
              Zona Artigianale Pradenich 2/A<br />
              32030 Cesiomaggiore (BL), Italia<br />
              Email: info@didieffe.com
            </p>

            <h3>2. Tipologie di Dati Raccolti</h3>
            <p>
              Tra i dati personali raccolti da questo sito, in modo autonomo o tramite terze parti, ci sono:
            </p>
            <ul>
              <li>Dati di navigazione (indirizzo IP, tipo di browser, sistema operativo)</li>
              <li>Cookie e dati di utilizzo</li>
              <li>Nome, cognome, email, numero di telefono (per richieste di contatto)</li>
              <li>Curriculum vitae (per candidature)</li>
            </ul>

            <h3>3. Finalità del Trattamento</h3>
            <p>I dati forniti dagli utenti vengono raccolti per le seguenti finalità:</p>
            <ul>
              <li>Rispondere alle richieste di informazioni e contatto</li>
              <li>Gestire le candidature di lavoro</li>
              <li>Migliorare l'esperienza di navigazione del sito</li>
              <li>Adempiere agli obblighi legali e contabili</li>
            </ul>

            <h3>4. Base Giuridica del Trattamento</h3>
            <p>Il trattamento dei dati è basato su:</p>
            <ul>
              <li>Consenso dell'interessato</li>
              <li>Esecuzione di un contratto o misure precontrattuali</li>
              <li>Adempimento di obblighi legali</li>
              <li>Legittimo interesse del Titolare</li>
            </ul>

            <h3>5. Modalità di Trattamento</h3>
            <p>
              I dati personali sono trattati con strumenti automatizzati per il tempo strettamente necessario a conseguire
              gli scopi per cui sono stati raccolti. Specifiche misure di sicurezza sono osservate per prevenire la perdita
              dei dati, usi illeciti o non corretti ed accessi non autorizzati.
            </p>

            <h3>6. Destinatari dei Dati</h3>
            <p>I dati potranno essere comunicati a:</p>
            <ul>
              <li>Soggetti che agiscono tipicamente in qualità di responsabili del trattamento</li>
              <li>Soggetti, enti o autorità a cui sia obbligatorio comunicare i dati personali in forza di disposizioni di legge</li>
            </ul>

            <h3>7. Trasferimento Dati Extra-UE</h3>
            <p>
              I dati non vengono trasferiti in paesi extra-UE. Eventuali trasferimenti saranno effettuati nel rispetto
              delle garanzie appropriate e opportune.
            </p>

            <h3>8. Diritti dell'Interessato</h3>
            <p>Gli utenti hanno il diritto di:</p>
            <ul>
              <li>Accedere ai propri dati personali</li>
              <li>Rettificare dati inesatti o incompleti</li>
              <li>Cancellare i propri dati (diritto all'oblio)</li>
              <li>Limitare il trattamento dei dati</li>
              <li>Opporsi al trattamento</li>
              <li>Richiedere la portabilità dei dati</li>
              <li>Revocare il consenso in qualsiasi momento</li>
            </ul>
            <p>
              Per esercitare questi diritti, è possibile contattare il Titolare all'indirizzo: <strong>info@didieffe.com</strong>
            </p>

            <h3>9. Reclamo all'Autorità di Controllo</h3>
            <p>
              Gli interessati che ritengono che il trattamento dei dati personali a loro riferiti avvenga in violazione
              di quanto previsto dal GDPR hanno il diritto di proporre reclamo all'Autorità Garante per la Protezione
              dei Dati Personali (www.garanteprivacy.it).
            </p>

            <h3>10. Modifiche alla Privacy Policy</h3>
            <p>
              Il Titolare del Trattamento si riserva il diritto di apportare modifiche alla presente privacy policy
              in qualunque momento dandone informazione agli utenti su questa pagina. Si prega dunque di consultare
              spesso questa pagina.
            </p>

            <p className="text-sm text-gray-500 mt-8">
              Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
