'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslatedValue } from '@/lib/product-utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// SECURITY: rehypeRaw removed to prevent XSS attacks via HTML injection

// Browser logger (solo per sviluppo, in produzione usa file logger server-side)
const browserLog = {
  info: (msg: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AIDescription] ${msg}`, data || '');
    }
  },
  error: (msg: string, error?: any) => {
    console.error(`[AIDescription] ${msg}`, error || '');
  }
};

interface AIDescriptionProps {
  productCode: string;
  productData: {
    nome: any;
    descrizione?: any;
    immagine?: string;
    attributi?: any;
  };
}

export default function AIDescription({ productCode, productData }: AIDescriptionProps) {
  const { currentLang } = useLanguage();
  const [description, setDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sparklePositions, setSparklePositions] = useState<Array<{left: number, top: number}>>([]);

  // Generate sparkle positions only on client to avoid hydration mismatch
  useEffect(() => {
    setSparklePositions(
      Array.from({ length: 8 }, () => ({
        left: 30 + Math.random() * 40,
        top: 30 + Math.random() * 40,
      }))
    );
  }, []);

  useEffect(() => {
    // AbortController per cancellare richieste in corso quando il prodotto cambia
    const abortController = new AbortController();
    let isSubscribed = true;

    async function fetchAIDescription() {
      try {
        setLoading(true);
        setError(null);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://shop.didieffeb2b.com';
        const langKey = currentLang === 'en' ? 'en_us' : currentLang;

        // Step 1: Prova a leggere descrizione esistente dal server
        browserLog.info(`Checking for existing description ${productCode} ${langKey}`);
        const timestamp = new Date().getTime();
        const getResponse = await fetch(
          `${apiUrl}/admin/api/get-ai-description.php?code=${productCode}&lang=${langKey}&auto_generate=true&_=${timestamp}`,
          { signal: abortController.signal }
        );

        if (getResponse.ok) {
          const getData = await getResponse.json();
          if (getData.success && getData.description) {
            browserLog.info('Found cached description');
            if (isSubscribed) {
              setDescription(getData.description);
              setLoading(false);
            }
            return;
          }
        }

        // Step 2: Descrizione non esiste, generala
        browserLog.info('No cached description, generating new one');

        // Prepara i dati del prodotto
        const nome = getTranslatedValue(productData.nome, currentLang);
        const descrizione = productData.descrizione
          ? getTranslatedValue(productData.descrizione, currentLang)
          : '';

        // Estrai attributi dal prodotto
        let serie = '', materiale = '', colore = '', categoria = '', tipologia = '';
        if (productData.attributi) {
          Object.entries(productData.attributi).forEach(([key, attrValue]: [string, any]) => {
            let value = '';
            if (typeof attrValue === 'object' && attrValue !== null && 'value' in attrValue) {
              const rawValue = attrValue.value;
              if (typeof rawValue === 'object') {
                value = getTranslatedValue(rawValue, currentLang);
              } else {
                value = String(rawValue);
              }
            } else {
              value = String(attrValue);
            }

            const keyLower = key.toLowerCase();
            if (keyLower.includes('serie')) serie = value;
            if (keyLower.includes('materiale')) materiale = value;
            if (keyLower.includes('colore')) colore = value;
            if (keyLower.includes('categoria')) categoria = value;
            if (keyLower.includes('tipologia')) tipologia = value;
          });
        }

        // Step 3: Genera nuova descrizione
        const requestBody = {
          code: productCode,
          language: langKey,
          productData: {
            codice: productCode,
            nome,
            descrizione,
            immagine: productData.immagine || '',
            serie,
            materiale,
            colore,
            categoria,
            tipologia,
          },
        };
        browserLog.info(`Generating description for ${productCode} ${langKey}`, requestBody);

        const response = await fetch(`${apiUrl}/admin/api/generate-ai-description.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: abortController.signal,
        });

        browserLog.info(`Response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();

          // Gestione silenziosa degli errori API (es: credito esaurito)
          // Non mostriamo errori all'utente, semplicemente non visualizziamo la descrizione AI
          if (response.status === 500 || response.status === 429 || response.status === 402) {
            browserLog.info('AI service temporarily unavailable, skipping description');
            if (isSubscribed) {
              setDescription(null);
              setError(null); // Non mostrare errore all'utente
              setLoading(false);
            }
            return;
          }

          browserLog.error('Error response:', errorText);
          throw new Error(`API error (${response.status}): ${errorText}`);
        }

        // Debug: leggi la risposta come testo prima
        const responseText = await response.text();
        browserLog.info('Raw response received');

        // Prova a parsare come JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          browserLog.info('Invalid JSON response, AI service may be unavailable');
          if (isSubscribed) {
            setDescription(null);
            setError(null);
            setLoading(false);
          }
          return;
        }
        browserLog.info('API response parsed successfully');

        // Aggiorna lo stato solo se il componente è ancora montato e la richiesta non è stata cancellata
        if (isSubscribed && data.success) {
          setDescription(data.description);
        } else if (isSubscribed && !data.success) {
          // Gestione silenziosa degli errori - non mostrare all'utente
          browserLog.info('AI generation failed, skipping description');
          setDescription(null);
          setError(null);
        }
      } catch (err) {
        // Ignora errori se la richiesta è stata cancellata (AbortError)
        if (err instanceof Error && err.name === 'AbortError') {
          browserLog.info(`Request aborted for product ${productCode}`);
          return;
        }

        if (isSubscribed) {
          browserLog.error('Error fetching AI description:', err);
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    fetchAIDescription();

    // Cleanup: cancella richieste in corso quando il componente viene smontato o quando cambia prodotto/lingua
    return () => {
      isSubscribed = false;
      abortController.abort();
      browserLog.info(`Cleanup: aborting requests for ${productCode}`);
    };
  }, [productCode, currentLang]); // Rimosso productData per evitare loop infinito

  if (loading) {
    return (
      <div className="relative bg-gradient-to-br from-gray-50 via-emerald-50 to-gray-50 rounded-lg p-12 overflow-hidden min-h-[280px] flex items-center justify-center border border-gray-200">
        {/* Sfondo sottile */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.08) 0%, transparent 70%)'
          }}></div>
        </div>

        {/* Contenuto centrale */}
        <div className="relative z-10 flex flex-col items-center justify-center space-y-8 max-w-lg">
          {/* Icona AI minimalista */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg animate-pulse-smooth">
              <svg className="w-12 h-12 text-white animate-draw" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            {/* Cerchio decorativo */}
            <div className="absolute inset-0 rounded-2xl border-2 border-emerald-300 animate-ping-slow opacity-30"></div>
          </div>

          {/* Testo con effetto typing */}
          <div className="text-center space-y-3">
            <h3 className="text-xl font-semibold text-gray-800">
              {currentLang === 'it' && 'Stiamo preparando la documentazione per te'}
              {currentLang === 'en' && 'We are preparing the documentation for you'}
              {currentLang === 'de' && 'Wir bereiten die Dokumentation für Sie vor'}
              {currentLang === 'fr' && 'Nous préparons la documentation pour vous'}
              {currentLang === 'es' && 'Estamos preparando la documentación para ti'}
              {currentLang === 'pt' && 'Estamos preparando a documentação para você'}
            </h3>

            {/* Punti animati */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-emerald-600 font-medium">
                {currentLang === 'it' ? 'Elaborazione' : currentLang === 'en' ? 'Processing' : currentLang === 'de' ? 'Verarbeitung' : currentLang === 'fr' ? 'Traitement' : currentLang === 'es' ? 'Procesando' : 'Processando'}
              </span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-dot-1"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-dot-2"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-dot-3"></span>
              </div>
            </div>
          </div>

          {/* Barra di progresso elegante */}
          <div className="w-full max-w-sm">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full animate-loading-bar shadow-sm"></div>
            </div>
          </div>

          {/* Indicatori step minimalisti */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-step-1"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300 animate-step-2"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300 animate-step-3"></div>
          </div>
        </div>

        {/* CSS personalizzato */}
        <style jsx>{`
          @keyframes pulse-smooth {
            0%, 100% { transform: scale(1); box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.3); }
            50% { transform: scale(1.05); box-shadow: 0 15px 35px -5px rgba(16, 185, 129, 0.4); }
          }
          @keyframes ping-slow {
            0% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.2); opacity: 0.1; }
            100% { transform: scale(1.4); opacity: 0; }
          }
          @keyframes draw {
            0% { stroke-dasharray: 0, 100; }
            50% { stroke-dasharray: 50, 100; }
            100% { stroke-dasharray: 100, 0; }
          }
          @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(0%); }
            100% { transform: translateX(100%); }
          }
          @keyframes dot-pulse {
            0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
            40% { opacity: 1; transform: scale(1.2); }
          }
          @keyframes step-pulse {
            0%, 33% { background-color: rgb(209, 213, 219); transform: scale(1); }
            17% { background-color: rgb(16, 185, 129); transform: scale(1.3); }
          }

          .animate-pulse-smooth {
            animation: pulse-smooth 2s ease-in-out infinite;
          }
          .animate-ping-slow {
            animation: ping-slow 2s ease-out infinite;
          }
          .animate-draw {
            animation: draw 3s ease-in-out infinite;
          }
          .animate-loading-bar {
            animation: loading-bar 2s ease-in-out infinite;
          }
          .animate-dot-1 {
            animation: dot-pulse 1.4s ease-in-out infinite;
            animation-delay: 0s;
          }
          .animate-dot-2 {
            animation: dot-pulse 1.4s ease-in-out infinite;
            animation-delay: 0.2s;
          }
          .animate-dot-3 {
            animation: dot-pulse 1.4s ease-in-out infinite;
            animation-delay: 0.4s;
          }
          .animate-step-1 {
            animation: step-pulse 3s ease-in-out infinite;
            animation-delay: 0s;
          }
          .animate-step-2 {
            animation: step-pulse 3s ease-in-out infinite;
            animation-delay: 1s;
          }
          .animate-step-3 {
            animation: step-pulse 3s ease-in-out infinite;
            animation-delay: 2s;
          }
        `}</style>
      </div>
    );
  }

  if (error || !description) {
    return null; // Non mostrare nulla se c'è un errore o non è abilitato
  }

  // La descrizione è in formato misto: Markdown + HTML inline per i loghi
  // Usa sempre ReactMarkdown che supporta HTML inline tramite rehype-raw

  return (
    <div className="ai-description-container prose prose-sm sm:prose-base max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Titoli personalizzati
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-3" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mt-6 mb-3 flex items-center gap-2 border-l-4 border-emerald-500 pl-4" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mt-5 mb-2 flex items-center gap-2" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-base sm:text-lg font-semibold text-gray-700 mt-4 mb-2" {...props} />
          ),
          // Paragrafi
          p: ({ node, ...props }) => (
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4" {...props} />
          ),
          // Liste
          ul: ({ node, ...props }) => (
            <ul className="space-y-2 mb-4 ml-6" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="space-y-2 mb-4 ml-6" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-sm sm:text-base text-gray-700 leading-relaxed" {...props} />
          ),
          // Grassetto
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-gray-900" {...props} />
          ),
          // Enfasi
          em: ({ node, ...props }) => (
            <em className="italic text-gray-800" {...props} />
          ),
          // Link
          a: ({ node, ...props }) => (
            <a className="text-emerald-600 hover:text-emerald-700 underline font-medium" {...props} />
          ),
          // Blocchi di codice
          code: ({ node, inline, ...props }: any) =>
            inline ? (
              <code className="bg-gray-100 text-emerald-700 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
            ) : (
              <code className="block bg-gray-50 border border-gray-200 text-gray-800 p-4 rounded-lg text-sm font-mono overflow-x-auto" {...props} />
            ),
          // Citazioni
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-emerald-500 pl-4 py-2 my-4 bg-emerald-50 text-gray-700 italic" {...props} />
          ),
          // Divisori
          hr: ({ node, ...props }) => (
            <hr className="my-6 border-gray-300" {...props} />
          ),
        }}
      >
        {description}
      </ReactMarkdown>
    </div>
  );
}
