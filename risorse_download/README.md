# Risorse Download

Questa cartella contiene tutti i file scaricabili dalla sezione Download del sito.

## Struttura Cartelle

```
risorse_download/
├── cataloghi/           # Cataloghi prodotti, listini prezzi
├── schede-tecniche/     # Schede tecniche prodotti
├── certificazioni/      # Certificati ISO, CE, ecc
└── documentazione/      # Manuali, guide installazione
```

## Come Gestire i File

### 1. Aggiungere Nuovi File
- Copiare il file PDF nella cartella appropriata
- Aggiornare il file `downloads.json` nella cartella frontend con le informazioni del nuovo file

### 2. Modificare File Esistenti
- Sostituire il file mantenendo lo stesso nome
- Oppure aggiornare il riferimento in `downloads.json`

### 3. Rimuovere File
- Eliminare il file dalla cartella
- Rimuovere la voce corrispondente da `downloads.json`

## File downloads.json

Il file `frontend/data/downloads.json` contiene il mapping di tutti i file disponibili:

```json
{
  "cataloghi": [
    {
      "id": "catalogo-generale-2024",
      "name": "Catalogo Generale 2024",
      "filename": "catalogo-generale-2024.pdf",
      "size": "15 MB",
      "format": "PDF",
      "path": "/downloads/cataloghi/catalogo-generale-2024.pdf"
    }
  ],
  "schede-tecniche": [...],
  "certificazioni": [...],
  "documentazione": [...]
}
```

## Note

- I file vengono serviti dalla route API `/api/download/:category/:filename`
- La gestione backend sarà implementata successivamente per:
  - Upload file tramite interfaccia admin
  - Generazione automatica di downloads.json
  - Gestione permessi e statistiche download
