const https = require('https');

https.get('https://shop.didieffeb2b.com/data/products.json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('✅ JSON valido');
      console.log('Prodotti:', json.prodotti ? json.prodotti.length : 'N/A');
      console.log('Ha _meta:', !!json._meta);
      console.log('Ha filtri:', json._meta && json._meta.filters ? json._meta.filters.length : 'N/A');

      const boolFilters = (json._meta && json._meta.filters)
        ? json._meta.filters.filter(f => f.field && f.field.includes('Applicazione'))
        : [];

      console.log('\n=== FILTRI BOOLEANI ===');
      boolFilters.forEach(f => {
        console.log('Filtro:', f.field);
        if (f.options && f.options[0]) {
          const val = f.options[0].value;
          console.log('  Type:', typeof val);
          console.log('  Value:', JSON.stringify(val));
          if (typeof val === 'object' && val !== null) {
            console.log('  ❌ BUG! Value è oggetto/array');
            if (val.it !== undefined) {
              console.log('  Contenuto .it:', val.it, '(tipo:', typeof val.it + ')');
            }
          } else {
            console.log('  ✅ OK! Value è primitivo');
          }
        }
        console.log('');
      });
    } catch (e) {
      console.error('❌ ERRORE parsing JSON:', e.message);
      console.log('Prime 500 caratteri:', data.substring(0, 500));
    }
  });
}).on('error', err => console.error('Errore:', err.message));
