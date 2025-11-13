const fs = require('fs');

const UI_LABELS_PATH = './frontend/config/ui-labels.json';
const TRANSLATIONS_PATH = './translations-complete.json';

function setNestedValue(obj, path, lang, value) {
  const parts = path.split('.');
  let current = obj;

  // Navigate to the nested object
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }

  // Get the final key
  const finalKey = parts[parts.length - 1];

  // Ensure the final object exists and has the structure
  if (!current[finalKey]) {
    current[finalKey] = {};
  }

  // Add the translation
  current[finalKey][lang] = value;
}

async function main() {
  console.log('📝 Applying manual translations...\n');

  // Load files
  const uiLabels = JSON.parse(fs.readFileSync(UI_LABELS_PATH, 'utf8'));
  const translations = JSON.parse(fs.readFileSync(TRANSLATIONS_PATH, 'utf8'));

  // Create backup
  const backupPath = UI_LABELS_PATH.replace('.json', `.backup-apply-${Date.now()}.json`);
  fs.copyFileSync(UI_LABELS_PATH, backupPath);
  console.log(`📦 Backup created: ${backupPath}\n`);

  let applied = 0;

  // Apply translations
  for (const [key, langs] of Object.entries(translations)) {
    for (const [lang, value] of Object.entries(langs)) {
      setNestedValue(uiLabels, key, lang, value);
      console.log(`✅ ${key} [${lang}]: ${value}`);
      applied++;
    }
  }

  // Save updated file
  fs.writeFileSync(UI_LABELS_PATH, JSON.stringify(uiLabels, null, 2), 'utf8');

  console.log(`\n💾 File updated: ${UI_LABELS_PATH}`);
  console.log(`📊 Translations applied: ${applied}`);
  console.log(`✅ Done!`);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
