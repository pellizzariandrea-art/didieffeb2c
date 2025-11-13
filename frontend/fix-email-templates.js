// fix-email-templates.js
// Script to fix email templates structure in Firestore

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'admin', 'didieffeb2b-ecommerce-firebase-adminsdk-fbsvc-fbd636cc08.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixTemplates() {
  console.log('🔍 Controllo template email in Firestore...\n');

  const templatesRef = db.collection('email_templates');
  const snapshot = await templatesRef.get();

  console.log(`📊 Trovati ${snapshot.size} template\n`);

  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log(`\n📧 Template: ${data.slug || 'NO SLUG'}`);
    console.log(`   ID: ${doc.id}`);
    console.log(`   Enabled: ${data.enabled}`);
    console.log(`   Ha translations: ${!!data.translations}`);

    if (data.translations) {
      console.log(`   Lingue: ${Object.keys(data.translations).join(', ')}`);
    } else {
      console.log(`   ❌ MANCA IL CAMPO TRANSLATIONS!`);
    }
  }

  console.log('\n\n❓ Vuoi eliminare tutti i template per ricrearli? (y/n)');
  console.log('   Dopo questo script, esegui: node init-auth-email-templates.js');

  process.exit(0);
}

fixTemplates().catch(error => {
  console.error('❌ Errore:', error);
  process.exit(1);
});
