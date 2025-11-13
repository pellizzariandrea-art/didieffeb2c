const http = require('http');

http.get('http://localhost:3001/api/debug/check-template?slug=account-setup', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log('✅ Template slug:', json.template.slug);
    console.log('✅ Enabled:', json.template.enabled);
    console.log('✅ Has translations:', !!json.template.translations);

    if (json.template.translations) {
      const langs = Object.keys(json.template.translations);
      console.log('✅ Languages:', langs.join(', '));
      console.log('\n📧 Esempio IT:');
      console.log('   Subject:', json.template.translations.it.subject);
      console.log('   Body length:', json.template.translations.it.body.length, 'chars');
    } else {
      console.log('❌ NO TRANSLATIONS FIELD!');
    }
  });
}).on('error', err => console.error('Error:', err.message));
