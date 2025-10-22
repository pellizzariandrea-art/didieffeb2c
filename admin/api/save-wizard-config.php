<?php
// admin/api/save-wizard-config.php - Save Wizard Configuration with Auto-Translation
header('Content-Type: application/json');

// Include config and functions
$configPath = __DIR__ . '/../config.php';
if (file_exists($configPath)) {
    require_once $configPath;
}

require_once __DIR__ . '/../includes/functions.php';

// Path to wizard config
$wizardConfigPath = __DIR__ . '/../data/wizard-config.json';

/**
 * Translate wizard step titles and subtitles
 */
function translateWizardStep(&$step, $translationSettings) {
    if (empty($translationSettings['enabled'])) {
        return; // Translations disabled
    }

    $languages = $translationSettings['languages'] ?? ['it'];
    $apiKey = $translationSettings['api_key'] ?? '';

    // Remove 'it' as it's the source language
    $languages = array_filter($languages, function($lang) {
        return $lang !== 'it';
    });

    if (empty($languages) || empty($apiKey)) {
        return; // No languages to translate or no API key
    }

    // Translate title
    if (isset($step['title']) && is_array($step['title'])) {
        $italianTitle = $step['title']['it'] ?? '';
        if (!empty($italianTitle)) {
            foreach ($languages as $lang) {
                if (!isset($step['title'][$lang]) || empty($step['title'][$lang])) {
                    // Check cache first
                    $cached = getTranslationCache($italianTitle, $lang);
                    if ($cached) {
                        $step['title'][$lang] = $cached;
                    } else {
                        $translated = translateText($italianTitle, $lang, $apiKey);
                        if ($translated && $translated !== $italianTitle) {
                            $step['title'][$lang] = $translated;
                            saveTranslationCache($italianTitle, $lang, $translated);
                        }
                    }
                }
            }
        }
    }

    // Translate subtitle
    if (isset($step['subtitle']) && is_array($step['subtitle'])) {
        $italianSubtitle = $step['subtitle']['it'] ?? '';
        if (!empty($italianSubtitle)) {
            foreach ($languages as $lang) {
                if (!isset($step['subtitle'][$lang]) || empty($step['subtitle'][$lang])) {
                    // Check cache first
                    $cached = getTranslationCache($italianSubtitle, $lang);
                    if ($cached) {
                        $step['subtitle'][$lang] = $cached;
                    } else {
                        $translated = translateText($italianSubtitle, $lang, $apiKey);
                        if ($translated && $translated !== $italianSubtitle) {
                            $step['subtitle'][$lang] = $translated;
                            saveTranslationCache($italianSubtitle, $lang, $translated);
                        }
                    }
                }
            }
        }
    }

    // Translate aiPrompt if present (optional, might want to keep in Italian)
    if (isset($step['aiPrompt']) && !empty($step['aiPrompt'])) {
        // For now, skip AI prompt translation - it's more technical
        // Could add later if needed
    }
}

try {
    // Get JSON input
    $input = file_get_contents('php://input');
    $config = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON: ' . json_last_error_msg());
    }

    // Validate required fields
    if (!isset($config['steps']) || !is_array($config['steps'])) {
        throw new Exception('Invalid configuration: missing steps array');
    }

    // Ensure version and lastUpdated
    if (!isset($config['version'])) {
        $config['version'] = '1.0.0';
    }
    $config['lastUpdated'] = date('Y-m-d');

    // Load translation settings
    $translationSettings = loadTranslationSettings();

    // Auto-translate all steps
    $translatedCount = 0;
    if (!empty($translationSettings['enabled'])) {
        foreach ($config['steps'] as &$step) {
            translateWizardStep($step, $translationSettings);
            $translatedCount++;
        }
        unset($step); // Break reference
    }

    // Save configuration
    $result = file_put_contents(
        $wizardConfigPath,
        json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
    );

    if ($result === false) {
        throw new Exception('Failed to write configuration file');
    }

    echo json_encode([
        'success' => true,
        'message' => 'Configuration saved successfully' .
                     ($translatedCount > 0 ? " ($translatedCount steps auto-translated)" : ''),
        'path' => $wizardConfigPath,
        'translated' => $translatedCount,
        'translation_enabled' => !empty($translationSettings['enabled'])
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
