// remove-redundant-templates.js
// Script to remove redundant email templates from Firestore

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'admin', 'didieffeb2b-ecommerce-firebase-adminsdk-fbsvc-fbd636cc08.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Templates to remove (redundant with verification email)
const templatesToRemove = [
  'welcome-email',        // New template, never used (benvenuto unificato)
  'b2c_welcome',          // Old B2C welcome template (redundant)
  'porova__2222',         // Test template
];

async function removeRedundantTemplates() {
  console.log('🗑️  Rimozione template email ridondanti...\n');

  const templatesRef = db.collection('email_templates');

  for (const slug of templatesToRemove) {
    try {
      // Find template by slug
      const snapshot = await templatesRef.where('slug', '==', slug).get();

      if (snapshot.empty) {
        console.log(`⚠️  Template "${slug}" non trovato, skip...`);
        continue;
      }

      // Delete all matching documents
      for (const doc of snapshot.docs) {
        await doc.ref.delete();
        console.log(`✅ Template "${doc.data().name}" (${slug}) eliminato con ID: ${doc.id}`);
      }
    } catch (error) {
      console.error(`❌ Errore eliminando template "${slug}":`, error.message);
    }
  }

  console.log('\n✨ Pulizia completata!');
  console.log('\n📝 Template rimanenti:');

  // List remaining templates
  const remaining = await templatesRef.get();
  remaining.forEach(doc => {
    const data = doc.data();
    console.log(`  - ${data.name} (${data.slug})`);
  });

  console.log('\n💡 Nota: Per rimuovere "Email Benvenuto B2C", vai su:');
  console.log('   http://localhost:3003/admin-panel/email-templates');
  console.log('   e clicca "Elimina" sul template.');

  process.exit(0);
}

removeRedundantTemplates().catch(error => {
  console.error('❌ Errore fatale:', error);
  process.exit(1);
});
