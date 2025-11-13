const https = require('https');

https.get('https://shop.didieffeb2b.com/products.json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const boolFilters = json._meta.filters.filter(f => f.field && f.field.includes('Applicazione'));

    console.log('=== FILTRI BOOLEANI NEL NUOVO EXPORT ===\n');

    boolFilters.forEach(f => {
      console.log('Filtro:', f.field);
      if (f.options && f.options[0]) {
        console.log('  Primo valore:', JSON.stringify(f.options[0].value));
        console.log('  Tipo:', typeof f.options[0].value);

        if (typeof f.options[0].value === 'object' && f.options[0].value !== null) {
          console.log('  ❌ BUG! Value è oggetto, dovrebbe essere boolean diretto');
          console.log('  Contenuto:', f.options[0].value);
        } else {
          console.log('  ✅ OK! Value è tipo primitivo (boolean/number/string)');
        }
      }
      console.log('');
    });
  });
}).on('error', err => console.error('Errore:', err.message));
