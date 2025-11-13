const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));

console.log('Total products:', data.prodotti.length);
console.log('File size:', JSON.stringify(data).length, 'bytes');

console.log('\nPrimi 3 prodotti:');
data.prodotti.slice(0,3).forEach((p,i) => {
    console.log('  ' + i + ':', p.codice, '- EN:', p.nome.en || '(vuoto)', '- DE:', p.nome.de || '(vuoto)');
});

console.log('\nUltimi 3 prodotti:');
data.prodotti.slice(-3).forEach((p,i) => {
    const idx = data.prodotti.length - 3 + i;
    console.log('  ' + idx + ':', p.codice, '- EN:', p.nome.en || '(vuoto)', '- DE:', p.nome.de || '(vuoto)');
});

const allEmpty = data.prodotti.every(p => (!p.nome.en || p.nome.en === '') && (!p.nome.de || p.nome.de === ''));
console.log('\n✅ Tutti vuoti?', allEmpty);
