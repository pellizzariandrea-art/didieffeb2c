<?php
/**
 * Read Brevo Email Logs API
 *
 * Endpoint to read the email logs from the log files
 *
 * Endpoint: GET /admin/api/read-email-logs.php?date=YYYY-MM-DD&lines=100
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $logDir = __DIR__ . '/../logs';

    // Get date parameter (default: today)
    $date = $_GET['date'] ?? date('Y-m-d');

    // Validate date format
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        throw new Exception('Invalid date format. Use YYYY-MM-DD');
    }

    // Get lines parameter (default: all)
    $maxLines = isset($_GET['lines']) ? (int)$_GET['lines'] : null;

    $logFile = $logDir . '/brevo-email-' . $date . '.log';

    if (!file_exists($logFile)) {
        // List available log files
        $availableLogs = [];
        if (is_dir($logDir)) {
            $files = scandir($logDir);
            foreach ($files as $file) {
                if (preg_match('/^brevo-email-(\d{4}-\d{2}-\d{2})\.log$/', $file, $matches)) {
                    $availableLogs[] = $matches[1];
                }
            }
        }

        echo json_encode([
            'success' => false,
            'error' => 'Log file not found for date: ' . $date,
            'available_dates' => $availableLogs
        ]);
        exit;
    }

    // Read log file
    $content = file_get_contents($logFile);

    // If maxLines is set, get only the last N lines
    if ($maxLines !== null) {
        $lines = explode("\n", $content);
        $lines = array_slice($lines, -$maxLines);
        $content = implode("\n", $lines);
    }

    // Get file stats
    $fileStats = stat($logFile);

    echo json_encode([
        'success' => true,
        'date' => $date,
        'log_content' => $content,
        'file_size' => $fileStats['size'],
        'last_modified' => date('Y-m-d H:i:s', $fileStats['mtime']),
        'lines_displayed' => $maxLines !== null ? "Last $maxLines lines" : "All lines"
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
