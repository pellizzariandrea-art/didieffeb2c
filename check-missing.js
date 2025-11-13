const data = JSON.parse(require('fs').readFileSync('temp-products.json', 'utf-8'));
console.log('Primi 5 prodotti:');
data.prodotti.slice(0, 5).forEach((p, i) => {
    console.log(`${i}: ${p.codice} - EN: "${p.nome.en}"`);
});

console.log('\nUltimi 5 prodotti:');
data.prodotti.slice(-5).forEach((p, i) => {
    const idx = data.prodotti.length - 5 + i;
    console.log(`${idx}: ${p.codice} - EN: "${p.nome.en}"`);
});

console.log('\nPrimi 5 prodotti SENZA traduzioni:');
data.prodotti
    .map((p, i) => ({...p, index: i}))
    .filter(p => !p.nome.en || p.nome.en.length === 0)
    .slice(0, 5)
    .forEach(p => console.log(`${p.index}: ${p.codice}`));
