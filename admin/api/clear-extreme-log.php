<?php
$logFile = dirname(__DIR__) . '/data/translation-extreme-debug.txt';

if (file_exists($logFile)) {
    unlink($logFile);
    echo "Log cancellato!";
} else {
    echo "Log non esistente";
}
