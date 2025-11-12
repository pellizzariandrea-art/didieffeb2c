// add-missing-b2b-langs.js
// Aggiunge le 3 lingue mancanti al template B2B confirmation

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

// Traduzioni mancanti per le 3 nuove lingue
const newTranslations = {
  hr: {
    subject: 'Registracija primljena - Di Dieffe B2B',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🏢 Registracija primljena</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Pozdrav {{ragioneSociale}},</p>

    <p style="font-size: 14px; color: #666; margin-bottom: 30px;">Hvala što ste se registrirali kao B2B kupac!</p>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #1e40af;">
        <strong>ℹ️ Vaš račun je trenutno na čekanju.</strong><br>
        Naš tim će pregledati vašu registraciju i uskoro će vas kontaktirati.
      </p>
    </div>

    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      Cordiali saluti,<br>Il team Di Dieffe B2B
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 12px; color: #999; text-align: center;">
      © ${new Date().getFullYear()} Di Dieffe B2B. All rights reserved.
    </p>
  </div>
</div>`
  },
  sl: {
    subject: 'Registracija prejeta - Di Dieffe B2B',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🏢 Registracija prejeta</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Pozdravljeni {{ragioneSociale}},</p>

    <p style="font-size: 14px; color: #666; margin-bottom: 30px;">Hvala, da ste se registrirali kot B2B stranka!</p>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #1e40af;">
        <strong>ℹ️ Vaš račun je trenutno v čakanju.</strong><br>
        Naša ekipa bo pregledala vašo registracijo in vas kmalu kontaktirala.
      </p>
    </div>

    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      Lep pozdrav,<br>Ekipa Di Dieffe B2B
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 12px; color: #999; text-align: center;">
      © ${new Date().getFullYear()} Di Dieffe B2B. All rights reserved.
    </p>
  </div>
</div>`
  },
  el: {
    subject: 'Η εγγραφή ελήφθη - Di Dieffe B2B',
    body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🏢 Η εγγραφή ελήφθη</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Γεια σας {{ragioneSociale}},</p>

    <p style="font-size: 14px; color: #666; margin-bottom: 30px;">Ευχαριστούμε που εγγραφήκατε ως πελάτης B2B!</p>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #1e40af;">
        <strong>ℹ️ Ο λογαριασμός σας βρίσκεται προς το παρόν σε εκκρεμότητα.</strong><br>
        Η ομάδα μας θα εξετάσει την εγγραφή σας και θα επικοινωνήσει σύντομα μαζί σας.
      </p>
    </div>

    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      Με εκτίμηση,<br>Η ομάδα Di Dieffe B2B
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 12px; color: #999; text-align: center;">
      © ${new Date().getFullYear()} Di Dieffe B2B. All rights reserved.
    </p>
  </div>
</div>`
  }
};

async function addMissingTranslations() {
  console.log('🔄 Aggiunta lingue mancanti al template B2B Confirmation...\n');

  const templatesRef = db.collection('email_templates');
  const snapshot = await templatesRef.where('slug', '==', 'b2b_confirmation').get();

  if (snapshot.empty) {
    console.log('❌ Template b2b_confirmation non trovato!');
    process.exit(1);
  }

  const doc = snapshot.docs[0];
  const currentData = doc.data();

  // Merge new translations
  const updatedTranslations = {
    ...currentData.translations,
    ...newTranslations
  };

  await doc.ref.update({
    translations: updatedTranslations,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('✅ Lingue aggiunte con successo:');
  console.log('   • Hrvatski (hr)');
  console.log('   • Slovenščina (sl)');
  console.log('   • Ελληνικά (el)');
  console.log('\n✨ Template B2B Confirmation ora completo con tutte le 9 lingue!');

  process.exit(0);
}

addMissingTranslations().catch(error => {
  console.error('❌ Errore:', error);
  process.exit(1);
});
