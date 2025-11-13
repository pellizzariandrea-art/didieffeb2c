// Questo script genera le traduzioni mancanti manualmente
// Copierò le traduzioni esistenti (EN→HR/SL/EL) come fallback temporaneo
// Poi l'utente potrà farle tradurre correttamente

const fs = require('fs');

const UI_LABELS_PATH = './frontend/config/ui-labels.json';

// Traduzioni base per le lingue mancanti
const manualTranslations = {
  // Croatian
  hr: {
    'Add to cart': 'Dodaj u košaricu',
    'View all': 'Pogledaj sve',
    'Others also viewed': 'Drugi su također pogledali',
    'Recently viewed': 'Nedavno pregledano',
    'Back to catalog': 'Natrag na katalog',
    'Technical specifications': 'Tehničke specifikacije',
    'Available documents': 'Dostupni dokumenti',
    'Products from the series': 'Proizvodi iz serije',
    'Other': 'Ostalo',
    'Other similar products': 'Drugi slični proizvodi',
    'No image available': 'Slika nije dostupna',
    'Click to zoom': 'Kliknite za uvećanje',
    'Quick view': 'Brzi pregled',
    'View full details': 'Pogledaj sve detalje',
    'Select variant': 'Odaberi varijantu',
    'Add to wishlist': 'Dodaj na listu želja',
    'In wishlist': 'Na listi želja',
    'Remove from wishlist': 'Ukloni s liste želja',
    'Downloads': 'Preuzimanja',
    'Actions': 'Radnje',
    'Loading...': 'Učitavanje...',
  },
  // Slovenian
  sl: {
    'Add to cart': 'Dodaj v košarico',
    'View all': 'Prikaži vse',
    'Others also viewed': 'Drugi so si ogledali tudi',
    'Recently viewed': 'Nedavno ogledano',
    'Back to catalog': 'Nazaj na katalog',
    'Technical specifications': 'Tehnične specifikacije',
    'Available documents': 'Razpoložljivi dokumenti',
    'Products from the series': 'Izdelki iz serije',
    'Other': 'Drugo',
    'Other similar products': 'Drugi podobni izdelki',
    'No image available': 'Slika ni na voljo',
    'Click to zoom': 'Kliknite za povečavo',
    'Quick view': 'Hiter pregled',
    'View full details': 'Prikaži vse podrobnosti',
    'Select variant': 'Izberi varianto',
    'Add to wishlist': 'Dodaj na seznam želja',
    'In wishlist': 'Na seznamu želja',
    'Remove from wishlist': 'Odstrani s seznama želja',
    'Downloads': 'Prenosi',
    'Actions': 'Dejanja',
    'Loading...': 'Nalaganje...',
  },
  // Greek
  el: {
    'Add to cart': 'Προσθήκη στο καλάθι',
    'View all': 'Προβολή όλων',
    'Others also viewed': 'Άλλοι είδαν επίσης',
    'Recently viewed': 'Πρόσφατα προβολή',
    'Back to catalog': 'Επιστροφή στον κατάλογο',
    'Technical specifications': 'Τεχνικές προδιαγραφές',
    'Available documents': 'Διαθέσιμα έγγραφα',
    'Products from the series': 'Προϊόντα της σειράς',
    'Other': 'Άλλο',
    'Other similar products': 'Άλλα παρόμοια προϊόντα',
    'No image available': 'Δεν υπάρχει εικόνα',
    'Click to zoom': 'Κλικ για μεγέθυνση',
    'Quick view': 'Γρήγορη προβολή',
    'View full details': 'Δείτε πλήρεις λεπτομέρειες',
    'Select variant': 'Επιλέξτε παραλλαγή',
    'Add to wishlist': 'Προσθήκη στη λίστα επιθυμιών',
    'In wishlist': 'Στη λίστα επιθυμιών',
    'Remove from wishlist': 'Αφαίρεση από τη λίστα επιθυμιών',
    'Downloads': 'Λήψεις',
    'Actions': 'Ενέργειες',
    'Loading...': 'Φόρτωση...',
  }
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

async function main() {
  console.log('🌍 Generating manual translations...\n');

  // Load current ui-labels.json
  const data = JSON.parse(fs.readFileSync(UI_LABELS_PATH, 'utf8'));
  const allKeys = flattenKeys(data);

  // Create backup
  const backupPath = UI_LABELS_PATH.replace('.json', `.backup-manual-${Date.now()}.json`);
  fs.copyFileSync(UI_LABELS_PATH, backupPath);
  console.log(`📦 Backup created: ${backupPath}\n`);

  const targetLangs = ['hr', 'sl', 'el'];
  let updated = 0;

  for (const item of allKeys) {
    const { key, value } = item;
    const enValue = value.en;

    if (!enValue) continue;

    for (const lang of targetLangs) {
      // Skip if translation exists and is not just English fallback
      if (value[lang] && value[lang] !== enValue) {
        continue;
      }

      // Try to find manual translation
      if (manualTranslations[lang][enValue]) {
        value[lang] = manualTranslations[lang][enValue];
        updated++;
        console.log(`✅ ${key} [${lang}]: ${value[lang]}`);
      } else {
        // Use English as fallback
        value[lang] = enValue;
      }
    }
  }

  // Save updated file
  fs.writeFileSync(UI_LABELS_PATH, JSON.stringify(data, null, 2), 'utf8');
  console.log(`\n💾 File updated: ${UI_LABELS_PATH}`);
  console.log(`📊 Translations added: ${updated}`);
  console.log(`⚠️  Remaining fallbacks (=English): ${allKeys.length * 3 - updated}`);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
