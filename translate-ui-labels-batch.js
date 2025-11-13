const fs = require('fs');

const UI_LABELS_PATH = './frontend/config/ui-labels.json';

// Map language codes to full names for Claude
const langNames = {
  de: 'German (Deutsch)',
  fr: 'French (Français)',
  es: 'Spanish (Español)',
  pt: 'Portuguese (Português)',
  hr: 'Croatian (Hrvatski)',
  sl: 'Slovenian (Slovenščina)',
  el: 'Greek (Ελληνικά)'
};

function flattenKeys(obj, prefix = '') {
  let result = [];
  for (let key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (typeof value === 'object' && value !== null) {
      if (value.it || value.en || value.de) {
        result.push({ key: fullKey, value });
      } else {
        result = result.concat(flattenKeys(value, fullKey));
      }
    }
  }
  return result;
}

async function batchTranslate(items, targetLang) {
  const settingsPath = './admin/data/translation-settings.json';

  if (!fs.existsSync(settingsPath)) {
    throw new Error('Translation settings not found');
  }

  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  const apiKey = settings.api_key;

  if (!apiKey) {
    throw new Error('API key not configured');
  }

  // Build the batch translation prompt
  const itemsText = items.map((item, idx) => {
    const sourceText = item.it || item.en;
    return `${idx + 1}. ${sourceText}`;
  }).join('\n');

  const prompt = `You are a professional translator for user interface labels in an e-commerce platform.

Translate the following UI labels from Italian to ${langNames[targetLang]}.

IMPORTANT INSTRUCTIONS:
1. Keep the SAME NUMBERING (1., 2., 3., etc.)
2. Translate ONLY the text, preserving any special characters like {count}, {current}, {total}, etc.
3. Keep HTML tags if present
4. Use appropriate e-commerce terminology
5. Keep translations concise (UI labels should be short)
6. For abbreviations like "Cod.", "Var.", "pz" use appropriate ${langNames[targetLang]} equivalents

SOURCE TEXTS (Italian):
${itemsText}

Provide ONLY the translations with their numbers, nothing else:`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: settings.model || 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const translatedText = result.content[0].text;

    // Parse the numbered translations
    const translations = [];
    const lines = translatedText.split('\n');

    for (const line of lines) {
      const match = line.match(/^(\d+)\.\s*(.+)$/);
      if (match) {
        const num = parseInt(match[1]) - 1;
        const translation = match[2].trim();
        translations[num] = translation;
      }
    }

    return translations;
  } catch (error) {
    console.error(`Batch translation error for ${targetLang}:`, error.message);
    return null;
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🌍 Starting BATCH UI labels translation...\n');

  // Load current ui-labels.json
  const data = JSON.parse(fs.readFileSync(UI_LABELS_PATH, 'utf8'));
  const allKeys = flattenKeys(data);

  // Find missing translations
  const targetLangs = ['hr', 'sl', 'el']; // Focus on missing languages
  const problems = [];

  allKeys.forEach(item => {
    const { key, value } = item;
    const enValue = value.en;
    const itValue = value.it;

    if (!enValue && !itValue) return;

    const missingLangs = [];
    targetLangs.forEach(lang => {
      if (!value[lang] || value[lang] === enValue) {
        missingLangs.push(lang);
      }
    });

    if (missingLangs.length > 0) {
      problems.push({
        key,
        en: enValue,
        it: itValue,
        missingLangs,
        value
      });
    }
  });

  console.log(`Total keys: ${allKeys.length}`);
  console.log(`Keys to translate: ${problems.length}\n`);

  if (problems.length === 0) {
    console.log('✅ All translations are up to date!');
    return;
  }

  // Create backup first
  const backupPath = UI_LABELS_PATH.replace('.json', `.backup-${Date.now()}.json`);
  fs.copyFileSync(UI_LABELS_PATH, backupPath);
  console.log(`📦 Backup created: ${backupPath}\n`);

  // Process each language separately
  for (const lang of targetLangs) {
    const itemsForLang = problems.filter(p => p.missingLangs.includes(lang));

    if (itemsForLang.length === 0) {
      console.log(`✅ ${langNames[lang]}: No translations needed\n`);
      continue;
    }

    console.log(`🔄 Translating ${itemsForLang.length} items to ${langNames[lang]}...`);

    // Process in batches of 50 to avoid token limits
    const BATCH_SIZE = 50;
    let totalTranslated = 0;

    for (let i = 0; i < itemsForLang.length; i += BATCH_SIZE) {
      const batch = itemsForLang.slice(i, Math.min(i + BATCH_SIZE, itemsForLang.length));
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(itemsForLang.length / BATCH_SIZE);

      console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} items)...`);

      const translations = await batchTranslate(batch, lang);

      if (translations && translations.length === batch.length) {
        batch.forEach((item, idx) => {
          if (translations[idx]) {
            item.value[lang] = translations[idx];
            totalTranslated++;
          } else {
            // Fallback to English
            item.value[lang] = item.en;
          }
        });
        console.log(`  ✅ Translated ${translations.filter(t => t).length}/${batch.length}`);
      } else {
        console.log(`  ❌ Batch failed, using English fallbacks`);
        batch.forEach(item => {
          item.value[lang] = item.en;
        });
      }

      // Rate limiting between batches
      if (i + BATCH_SIZE < itemsForLang.length) {
        await sleep(1000);
      }
    }

    console.log(`✅ ${langNames[lang]}: ${totalTranslated}/${itemsForLang.length} translated\n`);
  }

  // Save updated ui-labels.json
  console.log('💾 Saving updated ui-labels.json...');
  fs.writeFileSync(UI_LABELS_PATH, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ File updated: ${UI_LABELS_PATH}`);

  console.log(`\n📊 Summary: Translation complete!`);
  console.log(`  Original backup: ${backupPath}`);
  console.log(`  Updated file: ${UI_LABELS_PATH}`);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
