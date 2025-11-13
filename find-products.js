const fs = require('fs');
const https = require('https');

https.get('https://shop.didieffeb2b.com/data/products.json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const products = json.prodotti;

    // Raggruppa per Serie e Tipologia
    const bySerie = {};
    const byTipologia = {};

    products.forEach(p => {
      const serie = p.attributi?.Serie?.value?.it || '';
      const tipo = p.attributi?.Tipologia?.value?.it || '';

      if (serie) {
        if (!bySerie[serie]) bySerie[serie] = [];
        bySerie[serie].push(p.codice);
      }

      if (tipo) {
        if (!byTipologia[tipo]) byTipologia[tipo] = [];
        byTipologia[tipo].push(p.codice);
      }
    });

    // Trova prodotti con entrambi i gruppi popolati
    const candidates = products.filter(p => {
      const serie = p.attributi?.Serie?.value?.it || '';
      const tipo = p.attributi?.Tipologia?.value?.it || '';

      const hasSerie = serie && bySerie[serie] && bySerie[serie].length > 1;
      const hasTipo = tipo && byTipologia[tipo] && byTipologia[tipo].length > 1;

      return hasSerie && hasTipo;
    });

    console.log('Trovati', candidates.length, 'prodotti con entrambe le gallery popolate\n');

    if (candidates.length > 0) {
      const sample = candidates[0];
      const serie = sample.attributi.Serie.value.it;
      const tipo = sample.attributi.Tipologia.value.it;

      console.log('Esempio 1:');
      console.log('Codice:', sample.codice);
      console.log('Nome:', sample.nome.it);
      console.log('Serie:', serie, '(' + bySerie[serie].length + ' prodotti)');
      console.log('Tipologia:', tipo, '(' + byTipologia[tipo].length + ' prodotti)');
      console.log('URL: http://localhost:3000/products/' + sample.codice);
      console.log('');
    }

    if (candidates.length > 1) {
      const sample = candidates[1];
      const serie = sample.attributi.Serie.value.it;
      const tipo = sample.attributi.Tipologia.value.it;

      console.log('Esempio 2:');
      console.log('Codice:', sample.codice);
      console.log('Nome:', sample.nome.it);
      console.log('Serie:', serie, '(' + bySerie[serie].length + ' prodotti)');
      console.log('Tipologia:', tipo, '(' + byTipologia[tipo].length + ' prodotti)');
      console.log('URL: http://localhost:3000/products/' + sample.codice);
    }
  });
});
