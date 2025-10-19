<?php
/**
 * Script per trovare il path assoluto corretto
 */

echo "<h1>🔍 Trova Path Immagini</h1>";

// 1. Path corrente di questo file
$currentPath = __DIR__;
echo "<div style='background: #e3f2fd; padding: 20px; margin: 20px 0; border-radius: 8px;'>";
echo "<h2>1. Path corrente (dove si trova questo file):</h2>";
echo "<code style='font-size: 16px; background: white; padding: 10px; display: block;'>$currentPath</code>";
echo "</div>";

// 2. Document Root
$docRoot = $_SERVER['DOCUMENT_ROOT'];
echo "<div style='background: #f3e5f5; padding: 20px; margin: 20px 0; border-radius: 8px;'>";
echo "<h2>2. Document Root del dominio:</h2>";
echo "<code style='font-size: 16px; background: white; padding: 10px; display: block;'>$docRoot</code>";
echo "</div>";

// 3. Prova path possibili per img_catalogo_norm
echo "<div style='background: #e8f5e9; padding: 20px; margin: 20px 0; border-radius: 8px;'>";
echo "<h2>3. Provo path per img_catalogo_norm:</h2>";

// Estrae username da path corrente (tipicamente /home/USERNAME/...)
$pathParts = explode('/', $currentPath);
$username = $pathParts[2] ?? 'USERNAME'; // Posizione tipica username su Linux

$possiblePaths = [
    // Basato su document root
    str_replace('shop.didieffeb2b.com', 'didieffeb2b.com', $docRoot) . '/img_catalogo_norm/',

    // Basato su username
    "/home/$username/didieffeb2b.com/public_html/img_catalogo_norm/",
    "/home/$username/public_html/didieffeb2b.com/img_catalogo_norm/",
    "/home/$username/public_html/img_catalogo_norm/",

    // Path relativo (ricostruito da path corrente)
    dirname(dirname($currentPath)) . '/../didieffeb2b.com/public_html/img_catalogo_norm/',
];

$pathCorretto = null;

foreach ($possiblePaths as $testPath) {
    // Risolvi path relativo
    $resolvedPath = realpath($testPath);
    if ($resolvedPath === false) {
        $resolvedPath = $testPath;
    }

    $exists = is_dir($resolvedPath);

    echo "<div style='margin: 15px 0; padding: 15px; background: white; border-left: 5px solid " . ($exists ? 'green' : 'red') . ";'>";
    echo "<strong>Path testato:</strong><br>";
    echo "<code style='font-size: 14px;'>$resolvedPath</code><br><br>";

    if ($exists) {
        echo "<span style='color: green; font-weight: bold; font-size: 18px;'>✅ ESISTE!</span><br>";

        // Conta file
        $files = glob($resolvedPath . '/*.{jpg,JPG,jpeg,JPEG,png,PNG}', GLOB_BRACE);
        $fileCount = count($files);
        echo "<br>📁 File immagine trovati: <strong>$fileCount</strong><br>";

        if ($fileCount > 0) {
            echo "<br>📸 Primi 3 file:<br>";
            echo "<ul style='margin: 10px 0; font-family: monospace; font-size: 12px;'>";
            foreach (array_slice($files, 0, 3) as $file) {
                echo "<li>" . basename($file) . "</li>";
            }
            echo "</ul>";

            if (!$pathCorretto) {
                $pathCorretto = $resolvedPath;
            }
        }
    } else {
        echo "<span style='color: red;'>❌ Non esiste</span>";
    }
    echo "</div>";
}

echo "</div>";

// 4. Risultato finale
if ($pathCorretto) {
    echo "<div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; margin: 30px 0; border-radius: 12px;'>";
    echo "<h2 style='margin-top: 0; color: white;'>🎉 PATH TROVATO!</h2>";
    echo "<p style='font-size: 18px; margin: 20px 0;'>Usa questo path nella configurazione immagini:</p>";
    echo "<div style='background: rgba(255,255,255,0.2); padding: 20px; border-radius: 8px; font-family: monospace; font-size: 16px; word-break: break-all;'>";
    echo $pathCorretto;
    echo "</div>";
    echo "<br>";
    echo "<a href='pages/images.php' style='display: inline-block; background: white; color: #667eea; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;'>→ Vai alla Configurazione Immagini</a>";
    echo "</div>";
} else {
    echo "<div style='background: #ffebee; padding: 30px; margin: 30px 0; border-radius: 12px; border: 2px solid #f44336;'>";
    echo "<h2 style='color: #c62828; margin-top: 0;'>⚠️ Path non trovato automaticamente</h2>";
    echo "<p>Prova manualmente:</p>";
    echo "<ol>";
    echo "<li>Apri <strong>SiteGround File Manager</strong></li>";
    echo "<li>Naviga a <code>didieffeb2b.com/public_html/img_catalogo_norm</code></li>";
    echo "<li>Clicca sul pulsante <strong>Path</strong> in alto (vicino al nome cartella)</li>";
    echo "<li>Copia il path completo che appare</li>";
    echo "</ol>";
    echo "</div>";
}

// 5. Info aggiuntive
echo "<div style='background: #fafafa; padding: 20px; margin: 30px 0; border-radius: 8px; border: 1px solid #ddd;'>";
echo "<h3>ℹ️ Info Server:</h3>";
echo "<table style='width: 100%; border-collapse: collapse;'>";
echo "<tr><td style='padding: 8px; border-bottom: 1px solid #eee;'><strong>Server Software:</strong></td><td style='padding: 8px; border-bottom: 1px solid #eee;'>" . ($_SERVER['SERVER_SOFTWARE'] ?? 'N/A') . "</td></tr>";
echo "<tr><td style='padding: 8px; border-bottom: 1px solid #eee;'><strong>PHP Version:</strong></td><td style='padding: 8px; border-bottom: 1px solid #eee;'>" . phpversion() . "</td></tr>";
echo "<tr><td style='padding: 8px; border-bottom: 1px solid #eee;'><strong>Server Name:</strong></td><td style='padding: 8px; border-bottom: 1px solid #eee;'>" . ($_SERVER['SERVER_NAME'] ?? 'N/A') . "</td></tr>";
echo "<tr><td style='padding: 8px;'><strong>Script Filename:</strong></td><td style='padding: 8px;'>" . __FILE__ . "</td></tr>";
echo "</table>";
echo "</div>";
?>
