const fs = require('fs');
const data = JSON.parse(fs.readFileSync('admin/data_web/products.json', 'utf8'));

console.log('=== VERIFICA VALUE PROBLEMATICI ===\n');

const allFilters = data._meta.filters;
let problemCount = 0;

allFilters.forEach((filter, fi) => {
  if (filter.options) {
    filter.options.forEach((opt, oi) => {
      const val = opt.value;

      if (!val) {
        console.log(`Filtro ${fi} "${filter.field}" - Opzione ${oi}: value è null/undefined`);
        problemCount++;
      } else if (typeof val === 'object') {
        const itVal = val.it || val.en || Object.values(val)[0];

        if (!itVal) {
          console.log(`Filtro ${fi} "${filter.field}" - Opzione ${oi}: value oggetto VUOTO:`, JSON.stringify(val));
          problemCount++;
        } else if (typeof itVal !== 'string') {
          console.log(`Filtro ${fi} "${filter.field}" - Opzione ${oi}: value.it NON è stringa:`, JSON.stringify(val));
          problemCount++;
        }
      }
    });
  }
});

console.log('\n=== RIEPILOGO ===');
console.log('Totale problemi trovati:', problemCount);

if (problemCount === 0) {
  console.log('✅ Tutti i value sembrano corretti');
  console.log('\nIl problema potrebbe essere nel vecchio products.json sul server live');
  console.log('oppure nel modo in cui il frontend processa i filtri');
}
