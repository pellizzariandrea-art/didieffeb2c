<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Export Parziale</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .card {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        .info {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            border-left: 4px solid #2196f3;
        }
        .warning {
            background: #fff3cd;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            border-left: 4px solid #ffc107;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #4caf50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 5px;
            font-weight: bold;
        }
        .btn:hover {
            background: #45a049;
        }
        .btn-danger {
            background: #f44336;
        }
        .btn-danger:hover {
            background: #da190b;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>🧪 Test Export Parziale</h1>

        <div class="info">
            <strong>ℹ️ Info:</strong><br>
            L'ultimo export si è fermato al prodotto <strong>251 di 308</strong> (79%) dopo 8 minuti.<br>
            Usa questa pagina per testare solo gli ultimi prodotti.
        </div>

        <div class="warning">
            <strong>⚠️ Attenzione:</strong><br>
            Questo creerà un file JSON con SOLO i prodotti specificati, non sostituirà quello completo.
        </div>

        <h2>Opzioni di Test:</h2>

        <h3>1. Test ultimi 10 prodotti (246-255)</h3>
        <p>Testa solo gli ultimi 10 prodotti completati con successo</p>
        <a href="/admin/pages/export-stream.php?start_from=246&limit=10" class="btn" target="_blank">
            🧪 Test 10 prodotti
        </a>

        <h3>2. Test prodotti rimanenti (256-308)</h3>
        <p>Completa l'export dai prodotti rimasti (53 prodotti)</p>
        <a href="/admin/pages/export-stream.php?start_from=256" class="btn">
            📦 Export rimanenti (53 prodotti)
        </a>

        <h3>3. Test singolo prodotto problematico (256)</h3>
        <p>Testa solo il prodotto dove si è bloccato</p>
        <a href="/admin/pages/export-stream.php?start_from=256&limit=1" class="btn">
            🔍 Test prodotto 256
        </a>

        <h3>4. Export completo</h3>
        <p>Riprova l'export completo con le nuove ottimizzazioni</p>
        <a href="/admin/pages/export.php" class="btn btn-danger">
            🚀 Export Completo (tutti i 308)
        </a>

        <hr style="margin: 30px 0;">

        <h2>📊 Informazioni Tecniche:</h2>
        <ul>
            <li><strong>Prodotti totali:</strong> 308</li>
            <li><strong>Prodotti completati:</strong> 255 (83%)</li>
            <li><strong>Prodotti rimanenti:</strong> 53 (17%)</li>
            <li><strong>Tempo medio per prodotto:</strong> ~2 secondi (con 5 traduzioni)</li>
            <li><strong>Tempo stimato rimanenti:</strong> ~2 minuti</li>
        </ul>

        <div class="info">
            <strong>💡 Suggerimento:</strong><br>
            Inizia con il "Test 10 prodotti" per verificare che funzioni, poi procedi con i rimanenti.
        </div>
    </div>
</body>
</html>
