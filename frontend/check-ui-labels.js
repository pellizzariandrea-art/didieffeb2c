// check-ui-labels.js
// Verifica che tutte le label auth abbiano le 9 lingue

const uiLabels = require('./config/ui-labels.json');

const REQUIRED_LANGUAGES = ['it', 'en', 'de', 'fr', 'es', 'pt', 'hr', 'sl', 'el'];

console.log('🔍 Verifica label multilingua per autenticazione\n');
console.log('='.repeat(60));

const authLabels = uiLabels.auth;

if (!authLabels) {
  console.log('❌ Sezione "auth" non trovata in ui-labels.json!');
  process.exit(1);
}

let allOk = true;
let totalLabels = 0;
let missingTranslations = [];

function checkObject(obj, path = 'auth') {
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = `${path}.${key}`;

    if (typeof value === 'object' && value !== null) {
      // Check if it's a translation object (has language keys)
      const keys = Object.keys(value);
      const isTranslationObject = keys.some(k => REQUIRED_LANGUAGES.includes(k));

      if (isTranslationObject) {
        totalLabels++;
        const missing = REQUIRED_LANGUAGES.filter(lang => !value[lang]);

        if (missing.length > 0) {
          allOk = false;
          missingTranslations.push({
            path: currentPath,
            missing: missing
          });
        }
      } else {
        // Recurse into nested objects
        checkObject(value, currentPath);
      }
    }
  }
}

checkObject(authLabels);

console.log(`\n📊 Totale label auth: ${totalLabels}`);
console.log(`   Lingue richieste: ${REQUIRED_LANGUAGES.length} (${REQUIRED_LANGUAGES.join(', ')})\n`);

if (missingTranslations.length > 0) {
  console.log(`⚠️  Trovate ${missingTranslations.length} label con traduzioni mancanti:\n`);
  missingTranslations.forEach(({ path, missing }) => {
    console.log(`   ${path}`);
    console.log(`   Mancano: ${missing.join(', ')}\n`);
  });
} else {
  console.log('✅ Tutte le label auth hanno traduzioni complete per le 9 lingue!\n');
}

console.log('='.repeat(60));

if (allOk) {
  console.log('\n✅ Verifica completata: OK\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Verifica completata: Trovati problemi\n');
  process.exit(1);
}
