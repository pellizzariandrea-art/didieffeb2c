// Test generazione descrizione AI
const productCode = 'FAM010240XBB';
const lang = 'it';

const requestBody = {
  code: productCode,
  language: lang,
  productData: {
    codice: productCode,
    nome: 'Prodotto Test',
    descrizione: 'Descrizione test',
    immagine: '',
    serie: 'Serie Test',
    materiale: 'Metallo',
    colore: 'Bianco',
    categoria: 'Test',
    tipologia: 'Tipo Test',
  },
};

console.log('Testing AI generation...');
console.log('Request body:', JSON.stringify(requestBody, null, 2));

fetch('https://shop.didieffeb2b.com/admin/api/generate-ai-description.php', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(requestBody),
})
  .then(response => {
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    return response.text();
  })
  .then(text => {
    console.log('Response text:', text);
    try {
      const json = JSON.parse(text);
      console.log('Parsed JSON:', json);
    } catch (e) {
      console.error('Failed to parse as JSON');
    }
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
