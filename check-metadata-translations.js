const https = require('https');

https.get('https://shop.didieffeb2b.com/data/products.json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);

    console.log('=== CATEGORIE ===\n');
    if (json._meta.categories) {
      json._meta.categories.slice(0, 2).forEach(c => {
        console.log('Categoria:', c.field);
        console.log('  Label:', JSON.stringify(c.label));
        console.log('  Translations:', JSON.stringify(c.translations));
        console.log('  Ha greco (el)?', c.translations && c.translations.el ? 'SI' : 'NO');
        console.log('');
      });
    }

    console.log('\n=== FILTRI (stringhe, non booleani) ===\n');
    const strFilters = json._meta.filters.filter(f =>
      f.options && f.options.length > 0 &&
      f.field !== 'prezzo' &&
      !f.field.includes('Applicazione')
    );

    strFilters.slice(0, 2).forEach(f => {
      console.log('Filtro:', f.field);
      if (f.options[0]) {
        console.log('  Prima opzione label:', JSON.stringify(f.options[0].label));
        console.log('  Prima opzione value:', JSON.stringify(f.options[0].value));

        if (typeof f.options[0].value === 'object') {
          console.log('  Ha greco (el)?', f.options[0].value.el ? 'SI' : 'NO');
          console.log('  Ha solo IT?', Object.keys(f.options[0].value).length === 1 ? 'SI (BUG!)' : 'NO');
        }
      }
      console.log('');
    });
  });
}).on('error', err => console.error('Errore:', err.message));
