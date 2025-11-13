const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./frontend/config/ui-labels.json', 'utf8'));

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
const missing = allKeys.filter(item => !item.value.el);

console.log(`Total keys: ${allKeys.length}`);
console.log(`Missing Greek (el): ${missing.length}\n`);

if (missing.length > 0) {
  console.log('Keys without Greek translation:');
  missing.forEach(item => {
    console.log(`  ${item.key}`);
    console.log(`    EN: ${item.value.en || '(missing)'}`);
    console.log(`    IT: ${item.value.it || '(missing)'}`);
  });
}
