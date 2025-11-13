// Test script per verificare flusso email creazione utente
const fetch = require('node-fetch');

async function testEmailFlow() {
  console.log('🧪 Test flusso email creazione utente\n');

  // Test 1: Verifica template Firestore
  console.log('1️⃣ Verificando template email in Firestore...');
  try {
    const templatesRes = await fetch('http://localhost:3001/api/debug/check-template?slug=account-setup');
    const templatesData = await templatesRes.json();
    console.log('   Template trovato:', templatesData.found ? '✅ SI' : '❌ NO');
    if (templatesData.found) {
      console.log('   Lingue disponibili:', Object.keys(templatesData.template.translations).join(', '));
      console.log('   Enabled:', templatesData.template.enabled);
    }
  } catch (err) {
    console.error('   ❌ Errore:', err.message);
  }

  console.log('\n2️⃣ Testando proxy PHP Brevo...');
  try {
    const proxyRes = await fetch('https://shop.didieffeb2b.com/admin/api/send-brevo-email.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: { email: 'test@example.com', name: 'Test' },
        subject: 'Test Subject',
        htmlContent: '<p>Test</p>',
        sender: { email: 'noreply@didieffe.com', name: 'Test' }
      })
    });
    const proxyData = await proxyRes.json();
    console.log('   Proxy PHP:', proxyData.success ? '✅ FUNZIONA' : '❌ ERRORE');
    if (proxyData.messageId) {
      console.log('   MessageId:', proxyData.messageId);
    }
    if (proxyData.error) {
      console.error('   Errore:', proxyData.error);
    }
  } catch (err) {
    console.error('   ❌ Errore:', err.message);
  }

  console.log('\n3️⃣ Testando creazione utente (senza realmente creare)...');
  console.log('   ℹ️  Per testare completamente, usa il pannello admin e controlla i log');
  console.log('   ℹ️  Endpoint: http://localhost:3001/admin-panel/users');
  console.log('   ℹ️  Email logs: http://localhost:3001/admin-panel/email-logs');
}

testEmailFlow().catch(console.error);
