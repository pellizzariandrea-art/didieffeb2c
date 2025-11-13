const fs = require('fs');
const path = require('path');

const UI_LABELS_PATH = './frontend/config/ui-labels.json';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://shop.didieffeb2b.com';

const targetLangs = ['de', 'fr', 'es', 'pt', 'hr', 'sl', 'el'];

const langNames = {
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  pt: 'Portuguese',
  hr: 'Croatian',
  sl: 'Slovenian',
  el: 'Greek'
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

function setNestedValue(obj, path, value) {
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }

  current[parts[parts.length - 1]] = value;
}

async function translateText(text, targetLang) {
  try {
    const response = await fetch(`${BACKEND_URL}/admin/api/translate-text.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        target_language: targetLang
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Translation failed');
    }

    return result.translation;
  } catch (error) {
    console.error(`Error translating "${text}" to ${targetLang}:`, error.message);
    return null;
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🌍 Starting UI labels translation...\n');

  // Load current ui-labels.json
  const data = JSON.parse(fs.readFileSync(UI_LABELS_PATH, 'utf8'));
  const allKeys = flattenKeys(data);

  // Find missing translations
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

  let translated = 0;
  let failed = 0;

  for (let i = 0; i < problems.length; i++) {
    const item = problems[i];
    const progress = `[${i + 1}/${problems.length}]`;

    console.log(`${progress} ${item.key}`);
    console.log(`  Source (IT): ${item.it || item.en}`);

    // Use Italian as source if available, otherwise English
    const sourceText = item.it || item.en;

    for (const lang of item.missingLangs) {
      process.stdout.write(`  Translating to ${langNames[lang]}... `);

      const translation = await translateText(sourceText, lang);

      if (translation && translation !== sourceText) {
        item.value[lang] = translation;
        console.log(`✅ ${translation}`);
        translated++;
      } else {
        console.log(`❌ Failed`);
        failed++;
        // Keep English as fallback
        if (!item.value[lang]) {
          item.value[lang] = item.en;
        }
      }

      // Rate limiting: wait 100ms between calls
      await sleep(100);
    }

    console.log('');
  }

  // Save updated ui-labels.json
  console.log('💾 Saving updated ui-labels.json...');

  // Create backup first
  const backupPath = UI_LABELS_PATH.replace('.json', '.backup.json');
  fs.copyFileSync(UI_LABELS_PATH, backupPath);
  console.log(`📦 Backup created: ${backupPath}`);

  fs.writeFileSync(UI_LABELS_PATH, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ File updated: ${UI_LABELS_PATH}`);

  console.log(`\n📊 Summary:`);
  console.log(`  ✅ Translated: ${translated}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📝 Total keys updated: ${problems.length}`);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
