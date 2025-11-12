<?php
/**
 * Brevo Email Proxy API
 *
 * This API acts as a proxy to send emails via Brevo from a static IP (SiteGround).
 * Needed because Vercel has dynamic IPs and Brevo requires IP whitelisting.
 *
 * Endpoint: POST /admin/api/send-brevo-email.php
 *
 * Request Body (JSON):
 * {
 *   "to": {"email": "user@example.com", "name": "User Name"},
 *   "subject": "Email Subject",
 *   "htmlContent": "<html>...</html>",
 *   "textContent": "Plain text content (optional)",
 *   "sender": {"email": "noreply@didieffe.com", "name": "Didieffe B2B"},
 *   "replyTo": {"email": "reply@didieffe.com", "name": "Support"}
 * }
 *
 * Response (JSON):
 * {
 *   "success": true,
 *   "messageId": "<message-id@brevo.com>"
 * }
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    // Get request body
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        throw new Exception('Invalid JSON payload');
    }

    // Validate required fields
    if (!isset($data['to']) || !isset($data['subject']) || !isset($data['htmlContent'])) {
        throw new Exception('Missing required fields: to, subject, htmlContent');
    }

    // Get Brevo API key from multiple sources (in order of preference)

    // 1. Try environment variable (most secure - set in cPanel)
    $brevoApiKey = getenv('BREVO_API_KEY');

    // 2. Try hardcoded constant (NOT RECOMMENDED - use environment variable instead)
    // if (!$brevoApiKey) {
    //     $brevoApiKey = 'YOUR_BREVO_API_KEY_HERE';
    // }

    // 3. Try protected config file (least secure, needs .htaccess protection)
    if (!$brevoApiKey) {
        $configFile = __DIR__ . '/../data/email-config.json';
        if (file_exists($configFile)) {
            $config = json_decode(file_get_contents($configFile), true);
            $brevoApiKey = $config['apiKey'] ?? null;
        }
    }

    if (!$brevoApiKey) {
        throw new Exception('Brevo API key not configured');
    }

    // Prepare Brevo API request
    $brevoPayload = [
        'sender' => $data['sender'] ?? [
            'email' => 'noreply@didieffe.com',
            'name' => 'Didieffe B2B'
        ],
        'to' => [$data['to']],
        'subject' => $data['subject'],
        'htmlContent' => $data['htmlContent']
    ];

    // Add optional fields
    if (isset($data['textContent'])) {
        $brevoPayload['textContent'] = $data['textContent'];
    }

    if (isset($data['replyTo'])) {
        $brevoPayload['replyTo'] = $data['replyTo'];
    }

    // Send request to Brevo
    $ch = curl_init('https://api.brevo.com/v3/smtp/email');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($brevoPayload),
        CURLOPT_HTTPHEADER => [
            'accept: application/json',
            'api-key: ' . $brevoApiKey,
            'content-type: application/json'
        ],
        CURLOPT_TIMEOUT => 30
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        throw new Exception('Curl error: ' . $curlError);
    }

    $result = json_decode($response, true);

    if ($httpCode !== 201) {
        $errorMsg = $result['message'] ?? 'Unknown Brevo error';
        throw new Exception('Brevo API error (HTTP ' . $httpCode . '): ' . $errorMsg);
    }

    // Success
    echo json_encode([
        'success' => true,
        'messageId' => $result['messageId'] ?? null,
        'message' => 'Email sent successfully'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
