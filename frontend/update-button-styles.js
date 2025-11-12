// update-button-styles.js
// Script per aggiornare il CSS dei pulsanti nei template email esistenti

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'admin', 'didieffeb2b-ecommerce-firebase-adminsdk-fbsvc-fbd636cc08.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Nuovo stile per i pulsanti (ottimizzato per mobile)
const oldButtonStyle = /style="background: linear-gradient\(135deg, #[0-9a-f]{6} 0%, #[0-9a-f]{6} 100%\); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;"/g;

const newButtonStyle = 'style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"';

async function updateButtonStyles() {
  console.log('🚀 Aggiornamento stili pulsanti nei template email...\n');

  try {
    const templatesRef = db.collection('email_templates');
    const snapshot = await templatesRef.get();

    if (snapshot.empty) {
      console.log('⚠️  Nessun template trovato');
      return;
    }

    let updatedCount = 0;

    for (const doc of snapshot.docs) {
      const template = doc.data();
      let hasChanges = false;
      const updatedTranslations = { ...template.translations };

      // Aggiorna ogni lingua
      for (const [lang, content] of Object.entries(template.translations)) {
        if (content.body) {
          // Sostituisci lo stile vecchio con quello nuovo
          const updatedBody = content.body.replace(
            /style="background: linear-gradient\(135deg, #[0-9a-f]{6} 0%, #[0-9a-f]{6} 100%\); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;"/g,
            'style="background-color: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #059669; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"'
          ).replace(
            // Anche lo stile con gradiente viola per reset password
            /style="background: linear-gradient\(135deg, #667eea 0%, #764ba2 100%\); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;"/g,
            'style="background-color: #667eea; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; min-width: 200px; border: 2px solid #764ba2; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"'
          );

          if (updatedBody !== content.body) {
            updatedTranslations[lang] = {
              ...content,
              body: updatedBody
            };
            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        await templatesRef.doc(doc.id).update({
          translations: updatedTranslations,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastModifiedBy: 'system-button-update'
        });
        console.log(`✅ Template "${template.name}" (${template.slug}) aggiornato`);
        updatedCount++;
      } else {
        console.log(`⏭️  Template "${template.name}" (${template.slug}) - nessun cambiamento necessario`);
      }
    }

    console.log(`\n✨ Aggiornamento completato! ${updatedCount} template aggiornati.`);
  } catch (error) {
    console.error('❌ Errore durante l\'aggiornamento:', error);
    process.exit(1);
  }
}

// Esegui lo script
updateButtonStyles().then(() => {
  process.exit(0);
});
