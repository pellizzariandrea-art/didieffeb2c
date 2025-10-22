<?php
// admin/api/get-wizard-config.php - Get Wizard Configuration
header('Content-Type: application/json');

// Include config
$configPath = __DIR__ . '/../config.php';
if (file_exists($configPath)) {
    require_once $configPath;
}

// Path to wizard config
$wizardConfigPath = __DIR__ . '/../data/wizard-config.json';

try {
    if (!file_exists($wizardConfigPath)) {
        // Create default config if doesn't exist
        $defaultConfig = [
            'version' => '1.0.0',
            'lastUpdated' => date('Y-m-d'),
            'steps' => [
                [
                    'id' => 'category',
                    'order' => 1,
                    'type' => 'category',
                    'required' => true,
                    'title' => [
                        'it' => 'Cosa stai cercando?',
                        'en' => 'What are you looking for?',
                        'de' => 'Was suchen Sie?',
                        'fr' => 'Que cherchez-vous?',
                        'es' => '¿Qué estás buscando?',
                        'pt' => 'O que você está procurando?'
                    ],
                    'subtitle' => [
                        'it' => 'Seleziona la tipologia di prodotto',
                        'en' => 'Select the product type',
                        'de' => 'Wählen Sie den Produkttyp',
                        'fr' => 'Sélectionnez le type de produit',
                        'es' => 'Selecciona el tipo de producto',
                        'pt' => 'Selecione o tipo de produto'
                    ],
                    'aiPrompt' => 'L\'utente sta cercando un prodotto. Aiutalo a identificare la categoria tra: {categories}',
                    'allowTextInput' => false
                ]
            ],
            'ai' => [
                'enabled' => false,
                'provider' => 'claude',
                'model' => 'claude-3-sonnet',
                'systemPrompt' => 'Sei un assistente che aiuta gli utenti a trovare prodotti per serramenti.',
                'temperature' => 0.7
            ]
        ];

        file_put_contents($wizardConfigPath, json_encode($defaultConfig, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $config = $defaultConfig;
    } else {
        $config = json_decode(file_get_contents($wizardConfigPath), true);
    }

    echo json_encode([
        'success' => true,
        'config' => $config
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
