const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./frontend/config/ui-labels.json', 'utf8'));

const targetLangs = ['de', 'fr', 'es', 'pt', 'hr', 'sl', 'el'];

function flattenKeys(obj, prefix = '') {
  let result = [];
  for (let key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (typeof value === 'object' && value !== null) {
      // Check if it's a translation object (has 'it', 'en', etc.)
      if (value.it || value.en || value.de) {
        result.push({ key: fullKey, value });
      } else {
        // It's a nested object, recurse
        result = result.concat(flattenKeys(value, fullKey));
      }
    }
  }
  return result;
}

const allKeys = flattenKeys(data);
const problems = [];

allKeys.forEach(item => {
  const { key, value } = item;
  const enValue = value.en;

  if (!enValue) return; // Skip if no English value

  const missingLangs = [];

  targetLangs.forEach(lang => {
    // Check if translation is missing or identical to English
    if (!value[lang] || value[lang] === enValue) {
      missingLangs.push(lang);
    }
  });

  if (missingLangs.length > 0) {
    problems.push({
      key,
      en: enValue,
      it: value.it || '(missing)',
      missingLangs
    });
  }
});

console.log(`Total translation keys: ${allKeys.length}`);
console.log(`Keys with missing/wrong translations: ${problems.length}\n`);

if (problems.length > 0) {
  console.log('Keys needing translation:\n');
  problems.forEach(item => {
    console.log(`Key: ${item.key}`);
    console.log(`  IT: ${item.it}`);
    console.log(`  EN: ${item.en}`);
    console.log(`  Missing in: ${item.missingLangs.join(', ')}`);
    console.log('');
  });
}
