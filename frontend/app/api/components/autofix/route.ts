// app/api/components/autofix/route.ts
// API endpoint to auto-fix component code errors using Claude

import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/components/autofix
 * Automatically fix errors in component code using Claude AI
 *
 * Body: {
 *   code: string,
 *   componentName: string,
 *   errorMessage: string,
 *   validationIssues?: Array<{type: string, key?: string, missingLanguages?: string[], pattern?: string, line?: number}>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, componentName, errorMessage, validationIssues } = body;

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

    // Build detailed error context
    let errorContext = '';
    if (errorMessage) {
      errorContext += `ERRORE DI SALVATAGGIO: ${errorMessage}\n\n`;
    }

    if (validationIssues && validationIssues.length > 0) {
      errorContext += `PROBLEMI DI VALIDAZIONE:\n`;
      validationIssues.forEach((issue: any, index: number) => {
        errorContext += `\n${index + 1}. Tipo: ${issue.type}\n`;
        if (issue.key) errorContext += `   Chiave: ${issue.key}\n`;
        if (issue.missingLanguages) errorContext += `   Lingue mancanti: ${issue.missingLanguages.join(', ')}\n`;
        if (issue.pattern) errorContext += `   Pattern non tradotto: ${issue.pattern}\n`;
        if (issue.line) errorContext += `   Linea: ${issue.line}\n`;
      });
      errorContext += '\n';
    }

    // Prepare AI prompt
    const prompt = `Sei un esperto di React e TypeScript. Devi sistemare un componente che ha errori di salvataggio o validazione.

COMPONENTE: ${componentName}

${errorContext}

## 🎯 FORMATO OUTPUT - LEGGERE PRIMA DI TUTTO!

**ATTENZIONE CRITICA**: La tua risposta DEVE iniziare IMMEDIATAMENTE con il code block TypeScript.
NON scrivere NULLA prima del code block. Nessuna frase introduttiva, nessuna spiegazione.

**❌ VIETATO ASSOLUTAMENTE:**
- "Perfetto..."
- "Ho corretto..."
- "Ecco il codice sistemato..."
- "Ho normalizzato..."
- Commenti tipo "// (spostato dentro...)"
- Qualsiasi testo prima o dopo il code block

**✅ OUTPUT VALIDO (UNICO FORMATO ACCETTATO):**

INIZIO RISPOSTA ↓
\`\`\`typescript
'use client';
[... codice completo ...]
\`\`\`
FINE RISPOSTA ↑

**Se la tua risposta contiene anche solo UNA parola prima del \`\`\`typescript, verrà SCARTATA.**

---

REGOLE CRITICHE PER IL FIX:

1. **EXPORT DEFAULT**: Il componente DEVE avere \`export default function ${componentName}\` (NON dimenticare "default"!)

2. **FORMATO CODICE**: Il codice DEVE iniziare con:
   - 'use client'; oppure
   - "use client"; oppure
   - import ... oppure
   - // (commento - solo se è un separatore multi-componente)

3. **TRADUZIONI MULTILINGUA**: Ogni testo UI DEVE essere tradotto in 6 lingue (it, en, de, fr, es, pt)
   - Crea oggetti TEXTS con tutte e 6 le lingue
   - NON usare filter.label, col.label direttamente - crea funzioni di mapping
   - Esempio CORRETTO:
     \`\`\`typescript
     const TEXTS = {
       filterAnno: { it: 'Anno', en: 'Year', de: 'Jahr', fr: 'Année', es: 'Año', pt: 'Ano' },
       // ... tutte le altre label
     };

     function getFilterLabel(filter: ReportFilter): string {
       const key = \`filter\${filter.field.charAt(0).toUpperCase() + filter.field.slice(1)}\`;
       if (TEXTS[key]) return TEXTS[key][language];
       return filter.field;
     }
     \`\`\`

4. **SEPARATORI MULTI-COMPONENTE**: Se il codice contiene più componenti, mantieni i separatori ESATTAMENTE così:
   \`\`\`
   // ============================================================
   // COMPONENTE: NomeComponente
   // FILE: components/reports/NomeComponente.tsx
   // ============================================================
   \`\`\`

5. **NON MODIFICARE**:
   - La logica di business
   - Le chiamate a ReportEngine.formatValue()
   - I nomi delle props esistenti
   - Gli import

CODICE DA SISTEMARE:
\`\`\`typescript
${code}
\`\`\`

---

## ⚠️ IMPORTANTE - RILEGGI PRIMA DI RISPONDERE:

La tua risposta DEVE essere ESATTAMENTE in questo formato:

\`\`\`typescript
[CODICE COMPLETO CORRETTO QUI - NIENT'ALTRO]
\`\`\`

NON SCRIVERE:
- ❌ "Ecco il codice corretto"
- ❌ "Ho sistemato i seguenti problemi"
- ❌ Spiegazioni
- ❌ Note
- ❌ Commenti extra

SOLO IL CODICE nel code block. NIENT'ALTRO.`;

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
        max_tokens: 16384, // Più tokens per componenti grandi
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

    let fixedCode = claudeData.content[0].text;

    // Clean up code blocks if AI wrapped it
    if (fixedCode.includes('```typescript')) {
      const match = fixedCode.match(/```typescript\n([\s\S]*?)\n```/);
      if (match) {
        fixedCode = match[1];
      }
    } else if (fixedCode.includes('```tsx')) {
      const match = fixedCode.match(/```tsx\n([\s\S]*?)\n```/);
      if (match) {
        fixedCode = match[1];
      }
    } else if (fixedCode.includes('```')) {
      const match = fixedCode.match(/```\n([\s\S]*?)\n```/);
      if (match) {
        fixedCode = match[1];
      }
    }

    return NextResponse.json({
      success: true,
      code: fixedCode,
      componentName,
      originalError: errorMessage,
    });

  } catch (error: any) {
    console.error('Error in component autofix route:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
