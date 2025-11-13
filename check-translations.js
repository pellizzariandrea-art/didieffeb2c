const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
let translated = 0;
let empty = 0;

data.prodotti.forEach(p => {
    if(p.nome.en && p.nome.en.length > 0) translated++;
    else empty++;
});

console.log('Prodotti con traduzioni:', translated);
console.log('Prodotti senza traduzioni:', empty);
console.log('Totale:', data.prodotti.length);
console.log('\nPrimi 5 prodotti vuoti:');
data.prodotti
    .filter(p => !p.nome.en || p.nome.en.length === 0)
    .slice(0, 5)
    .forEach(p => console.log('  -', p.codice, ':', p.nome.it));
