// check-email-templates.js
// Script to verify email templates completeness

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'admin', 'didieffeb2b-ecommerce-firebase-adminsdk-fbsvc-fbd636cc08.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const REQUIRED_LANGUAGES = ['it', 'en', 'de', 'fr', 'es', 'pt', 'hr', 'sl', 'el'];
const REQUIRED_AUTH_TEMPLATES = [
  { slug: 'email-verification', name: 'Verifica Email' },
  { slug: 'reset-password', name: 'Reset Password' },
  { slug: 'account-setup', name: 'Configurazione Account' },
  { slug: 'b2b_confirmation', name: 'Email Conferma B2B' },
];

async function checkEmailTemplates() {
  console.log('🔍 Verifica completezza template email\n');
  console.log('=' .repeat(60));

  const templatesRef = db.collection('email_templates');
  const snapshot = await templatesRef.get();

  const templates = [];
  snapshot.forEach(doc => {
    templates.push({ id: doc.id, ...doc.data() });
  });

  console.log(`\n📧 Template trovati: ${templates.length}\n`);

  let allOk = true;

  // Check required templates exist
  console.log('📋 Verifica template richiesti:\n');
  for (const required of REQUIRED_AUTH_TEMPLATES) {
    const found = templates.find(t => t.slug === required.slug);
    if (found) {
      console.log(`✅ ${required.name} (${required.slug})`);

      // Check languages
      let missingLangs = [];
      for (const lang of REQUIRED_LANGUAGES) {
        const trans = found.translations?.[lang];
        if (!trans || !trans.subject || !trans.body) {
          missingLangs.push(lang);
        }
      }

      if (missingLangs.length > 0) {
        console.log(`   ⚠️  Lingue mancanti: ${missingLangs.join(', ')}`);
        allOk = false;
      } else {
        console.log(`   ✅ Tutte le 9 lingue presenti`);
      }

      // Check variables
      if (found.variables && found.variables.length > 0) {
        console.log(`   📝 Variabili: ${found.variables.map(v => v.name).join(', ')}`);
      }

      // Check enabled
      if (!found.enabled) {
        console.log(`   ⚠️  Template DISABILITATO`);
        allOk = false;
      }

    } else {
      console.log(`❌ ${required.name} (${required.slug}) - NON TROVATO`);
      allOk = false;
    }
    console.log('');
  }

  console.log('=' .repeat(60));
  console.log('\n📊 Riepilogo template disponibili:\n');

  templates.forEach(t => {
    const langCount = REQUIRED_LANGUAGES.filter(lang =>
      t.translations?.[lang]?.subject && t.translations?.[lang]?.body
    ).length;

    const status = t.enabled ? '🟢' : '🔴';
    const langStatus = langCount === 9 ? '✅' : `⚠️ ${langCount}/9`;

    console.log(`${status} ${t.name} (${t.slug})`);
    console.log(`   Lingue: ${langStatus} | Variabili: ${t.variables?.length || 0} | Categoria: ${t.category}`);
  });

  console.log('\n' + '='.repeat(60));

  if (allOk) {
    console.log('\n✅ Tutti i template autenticazione sono completi e attivi!\n');
  } else {
    console.log('\n⚠️  Alcuni template hanno problemi. Controlla sopra per i dettagli.\n');
  }

  process.exit(0);
}

checkEmailTemplates().catch(error => {
  console.error('❌ Errore:', error);
  process.exit(1);
});
