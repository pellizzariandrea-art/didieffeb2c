<?php
// admin/api/get-email-config.php
// API to get email configuration

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

$configFile = __DIR__ . '/../data/email-config.json';

// Check if config file exists
if (!file_exists($configFile)) {
    // Create default configuration
    $defaultConfig = [
        'brevo' => [
            'senderEmail' => 'noreply@didieffe.com',
            'senderName' => 'Didieffe B2B',
            'replyToEmail' => 'apellizzari@didieffe.com',
            'replyToName' => 'Didieffe Support'
        ],
        'templates' => [
            'b2c_welcome' => [
                'subject' => 'Benvenuto su Didieffe B2B!',
                'enabled' => true
            ],
            'b2b_confirmation' => [
                'subject' => 'Richiesta Registrazione B2B Ricevuta - Didieffe',
                'enabled' => true
            ]
        ]
    ];

    file_put_contents($configFile, json_encode($defaultConfig, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    echo json_encode([
        'success' => true,
        'config' => $defaultConfig
    ]);
    exit;
}

// Read configuration
$config = json_decode(file_get_contents($configFile), true);

echo json_encode([
    'success' => true,
    'config' => $config
]);
