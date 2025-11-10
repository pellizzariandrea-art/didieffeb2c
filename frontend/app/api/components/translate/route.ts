// app/api/components/translate/route.ts
// API endpoint to translate React component UI texts via AI

import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/components/translate
 * Add multilingual TEXTS objects to a React component
 *
 * Body: { code: string, componentName: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, componentName } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Component code is required' },
        { status: 400 }
      );
    }

    // Read translation settings to get API key
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://shop.didieffeb2b.com';

    const settingsResponse = await fetch(`${backendUrl}/admin/data/translation-settings.json`);
    if (!settingsResponse.ok) {
      throw new Error('Failed to load translation settings');
    }

    const settings = await settingsResponse.json();

    if (!settings.api_key) {
      throw new Error('API key not configured in translation settings');
    }

    const aiModel = settings.ai_model || 'claude-sonnet-4-5-20250929';

    // Prepare AI prompt
    const prompt = `Aggiungi oggetti di traduzione multilingua a questo componente React.

COMPONENTE: ${componentName}

LINGUE DA SUPPORTARE: italiano (it), inglese (en), tedesco (de), francese (fr), spagnolo (es), portoghese (pt)

## 🎯 FORMATO OUTPUT - LEGGERE PRIMA DI TUTTO!

**ATTENZIONE CRITICA**: La tua risposta DEVE iniziare IMMEDIATAMENTE con il code block TypeScript.
NON scrivere NULLA prima del code block.

**❌ VIETATO:**
- "Ecco il componente tradotto..."
- "Ho aggiunto le traduzioni..."
- Spiegazioni, note, commenti extra

**✅ OUTPUT RICHIESTO:**
\`\`\`typescript
'use client';
[... codice completo ...]
\`\`\`

**Se scrivi anche solo UNA parola prima del code block, la risposta verrà scartata.**

---

ISTRUZIONI CRITICHE:
1. Identifica TUTTI i testi hardcoded UI (bottoni, messaggi, labels, placeholder, aria-label, etc.)
2. Crea un oggetto TEXTS all'inizio del componente (dopo imports, prima della funzione):

const TEXTS = {
  buttonExport: {
    it: 'Esporta',
    en: 'Export',
    de: 'Exportieren',
    fr: 'Exporter',
    es: 'Exportar',
    pt: 'Exportar'
  },
  messageLoading: {
    it: 'Caricamento...',
    en: 'Loading...',
    de: 'Laden...',
    fr: 'Chargement...',
    es: 'Cargando...',
    pt: 'Carregando...'
  },
  // ... tutti gli altri testi
};

3. Sostituisci tutti i testi hardcoded con: {TEXTS.textKey[language]}
4. Se il componente NON ha già una prop 'language', aggiungila all'interface delle props con default 'it'
5. NON modificare:
   - La logica del componente
   - Le props esistenti (tranne aggiungere 'language?: string' se manca)
   - Le chiamate a ReportEngine.formatValue()
   - Import statements
   - Export statements
6. Mantieni 'use client' se presente
7. Traduci accuratamente in tutte le 6 lingue (usa traduzioni professionali appropriate per UI)
8. NON tradurre:
   - Nomi di variabili, funzioni, props
   - Commenti nel codice
   - Nomi di classi CSS
   - Chiavi degli oggetti

CODICE COMPONENTE DA MODIFICARE:
\`\`\`typescript
${code}
\`\`\`

---

## ⚠️ IMPORTANTE - RILEGGI PRIMA DI RISPONDERE:

La tua risposta DEVE essere ESATTAMENTE:

\`\`\`typescript
[CODICE COMPLETO QUI]
\`\`\`

NON scrivere nient'altro. SOLO il code block con il codice.`;

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': settings.api_key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: aiModel,
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      throw new Error(`Claude API error: ${claudeResponse.status} - ${errorText}`);
    }

    const claudeData = await claudeResponse.json();

    if (!claudeData.content || !claudeData.content[0] || !claudeData.content[0].text) {
      throw new Error('Invalid response from Claude API');
    }

    let translatedCode = claudeData.content[0].text;

    // Clean up code blocks if AI wrapped it
    if (translatedCode.includes('```typescript')) {
      const match = translatedCode.match(/```typescript\n([\s\S]*?)\n```/);
      if (match) {
        translatedCode = match[1];
      }
    } else if (translatedCode.includes('```tsx')) {
      const match = translatedCode.match(/```tsx\n([\s\S]*?)\n```/);
      if (match) {
        translatedCode = match[1];
      }
    } else if (translatedCode.includes('```')) {
      const match = translatedCode.match(/```\n([\s\S]*?)\n```/);
      if (match) {
        translatedCode = match[1];
      }
    }

    return NextResponse.json({
      success: true,
      code: translatedCode,
      componentName
    });

  } catch (error: any) {
    console.error('Error in component translate route:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
