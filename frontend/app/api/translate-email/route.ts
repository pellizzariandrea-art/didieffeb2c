// app/api/translate-email/route.ts
// API endpoint for translating email templates

import { NextRequest, NextResponse } from 'next/server';
import { EmailContent, SupportedLanguage } from '@/types/settings';

// Language names for translation prompts
const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  it: 'Italian',
  en: 'English',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
  pt: 'Portuguese',
};

/**
 * Translate email content using Claude API via PHP backend
 */
async function translateText(text: string, targetLanguage: SupportedLanguage): Promise<string> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://shop.didieffeb2b.com';

    const response = await fetch(`${backendUrl}/admin/api/translate-content.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        targetLanguage,
        preserveHtml: true, // Preserve HTML tags and {{variables}}
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Translation failed');
    }

    return data.translatedText;
  } catch (error) {
    console.error('[TranslateText] Error:', error);
    throw error;
  }
}

/**
 * POST /api/translate-email
 * Translates email template from Italian to all other languages
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sourceLanguage,
      sourceContent,
      targetLanguages,
    } = body as {
      sourceLanguage: SupportedLanguage;
      sourceContent: EmailContent;
      targetLanguages: SupportedLanguage[];
    };

    // Validate input
    if (!sourceLanguage || !sourceContent || !targetLanguages) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (sourceLanguage !== 'it') {
      return NextResponse.json(
        { success: false, error: 'Only Italian source language is supported' },
        { status: 400 }
      );
    }

    console.log('[TranslateEmail] Translating from', sourceLanguage, 'to', targetLanguages);

    // Translate to all target languages
    const translations: Record<string, EmailContent> = {
      [sourceLanguage]: sourceContent, // Include original
    };

    for (const targetLang of targetLanguages) {
      if (targetLang === sourceLanguage) continue;

      try {
        console.log('[TranslateEmail] Translating to', targetLang);

        // Translate subject and body
        const translatedSubject = await translateText(sourceContent.subject, targetLang);
        const translatedBody = await translateText(sourceContent.body, targetLang);

        translations[targetLang] = {
          subject: translatedSubject,
          body: translatedBody,
        };

        console.log('[TranslateEmail] Completed translation to', targetLang);
      } catch (error) {
        console.error(`[TranslateEmail] Error translating to ${targetLang}:`, error);
        // Return original content as fallback
        translations[targetLang] = {
          subject: `[${targetLang.toUpperCase()}] ${sourceContent.subject}`,
          body: `[${targetLang.toUpperCase()}]\n${sourceContent.body}`,
        };
      }
    }

    return NextResponse.json({
      success: true,
      translations,
    });
  } catch (error: any) {
    console.error('[TranslateEmail] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Translation failed' },
      { status: 500 }
    );
  }
}
