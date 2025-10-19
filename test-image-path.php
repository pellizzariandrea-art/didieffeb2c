<?php
/**
 * Test script per trovare path assoluto immagini
 * Carica questo file su shop.didieffeb2b.com/admin/
 */

echo "<h1>Test Path Immagini</h1>";

// Possibili path su SiteGround (tipici)
$possiblePaths = [
    '/home/USERNAME/public_html/img_catalogo_norm/',
    '/home/USERNAME/didieffeb2b.com/img_catalogo_norm/',
    '/home/USERNAME/www/didieffeb2b.com/img_catalogo_norm/',
    '/var/www/didieffeb2b.com/img_catalogo_norm/',
    // Path relativo (se shop e didieffeb2b sono sotto stesso root)
    '../../img_catalogo_norm/',
    '../../../img_catalogo_norm/',
];

echo "<h2>1. Path corrente admin:</h2>";
echo "<code>" . __DIR__ . "</code><br><br>";

echo "<h2>2. Provo path possibili:</h2>";
foreach ($possiblePaths as $path) {
    $exists = is_dir($path);
    $readable = $exists ? is_readable($path) : false;

    echo "<div style='margin: 10px 0; padding: 10px; background: " . ($exists ? '#d4edda' : '#f8d7da') . "'>";
    echo "<strong>Path:</strong> <code>$path</code><br>";
    echo "<strong>Esiste:</strong> " . ($exists ? '✅ SI' : '❌ NO') . "<br>";

    if ($exists) {
        echo "<strong>Leggibile:</strong> " . ($readable ? '✅ SI' : '❌ NO') . "<br>";

        // Prova a listare file
        if ($readable) {
            $files = glob($path . '*.{jpg,JPG,jpeg,JPEG,png,PNG}', GLOB_BRACE);
            echo "<strong>File trovati:</strong> " . count($files) . "<br>";
            if (count($files) > 0) {
                echo "<strong>Primi 5 file:</strong><br>";
                echo "<ul>";
                foreach (array_slice($files, 0, 5) as $file) {
                    echo "<li>" . basename($file) . "</li>";
                }
                echo "</ul>";
            }
        }
    }
    echo "</div>";
}

echo "<h2>3. Test specifico immagine conosciuta:</h2>";
$testImage = 'FAA00245U0IR____.JPG';
echo "<p>Cerco: <code>$testImage</code></p>";

foreach ($possiblePaths as $path) {
    if (is_dir($path)) {
        $fullPath = $path . $testImage;
        if (file_exists($fullPath)) {
            echo "<div style='padding: 15px; background: #d4edda; border: 2px solid green; margin: 10px 0;'>";
            echo "✅ <strong>TROVATA!</strong><br>";
            echo "<strong>Path completo:</strong> <code>$fullPath</code><br>";
            echo "<strong>Dimensione:</strong> " . filesize($fullPath) . " bytes<br>";
            echo "<strong>URL pubblico:</strong> <code>https://didieffeb2b.com/img_catalogo_norm/$testImage</code><br>";
            echo "</div>";
            break;
        }
    }
}

echo "<h2>4. Suggerimento manuale:</h2>";
echo "<p>Se nessun path automatico funziona, collegati via <strong>SiteGround File Manager</strong> e:</p>";
echo "<ol>";
echo "<li>Naviga alla cartella <code>img_catalogo_norm</code></li>";
echo "<li>Clicca su 'Path' in alto per vedere il path assoluto</li>";
echo "<li>Copia il path e incollalo qui sotto</li>";
echo "</ol>";

echo "<h2>5. Test personalizzato:</h2>";
echo "<form method='get' style='padding: 20px; background: #e9ecef; border-radius: 5px;'>";
echo "<label><strong>Inserisci path manuale:</strong></label><br>";
echo "<input type='text' name='custom_path' value='" . ($_GET['custom_path'] ?? '') . "' style='width: 600px; padding: 8px; margin: 10px 0;' placeholder='/home/username/public_html/img_catalogo_norm/'><br>";
echo "<button type='submit' style='padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer;'>Test Path</button>";
echo "</form>";

if (!empty($_GET['custom_path'])) {
    $customPath = rtrim($_GET['custom_path'], '/') . '/';
    echo "<div style='margin-top: 20px; padding: 15px; background: #fff3cd; border: 1px solid #ffc107;'>";
    echo "<strong>Test custom path:</strong> <code>$customPath</code><br><br>";

    if (is_dir($customPath)) {
        echo "✅ Directory esiste!<br>";

        if (is_readable($customPath)) {
            echo "✅ Leggibile!<br>";

            $files = glob($customPath . '*.{jpg,JPG,jpeg,JPEG}', GLOB_BRACE);
            echo "✅ File trovati: " . count($files) . "<br>";

            if (count($files) > 0) {
                echo "<br><strong>Primi 10 file:</strong><ul>";
                foreach (array_slice($files, 0, 10) as $file) {
                    echo "<li>" . basename($file) . "</li>";
                }
                echo "</ul>";

                echo "<div style='background: #d4edda; padding: 15px; margin-top: 20px; border: 2px solid green;'>";
                echo "🎉 <strong>PERFETTO! Usa questo path in config.php:</strong><br>";
                echo "<code style='font-size: 14px;'>define('IMAGES_PATH', '$customPath');</code>";
                echo "</div>";
            }
        } else {
            echo "❌ Directory non leggibile (permessi)";
        }
    } else {
        echo "❌ Directory non esiste";
    }
    echo "</div>";
}
?>
