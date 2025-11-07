# Script PowerShell SICURO per caricare SOLO codice PHP (nessun dato)
# Usage: .\upload-wizard-files-safe.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Upload Wizard Files (SAFE)" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Percorso locale base
$localBase = "C:\users\pelli\claude\ecommerce\admin"

# Lista file da caricare - SOLO CODICE PHP
$files = @(
    # API Files (SOLO CODICE)
    @("$localBase\api\get-wizard-config.php", "/public_html/admin/api/get-wizard-config.php"),
    @("$localBase\api\save-wizard-config.php", "/public_html/admin/api/save-wizard-config.php"),
    @("$localBase\api\get-translation-settings.php", "/public_html/admin/api/get-translation-settings.php"),
    @("$localBase\api\reset-wizard-config.php", "/public_html/admin/api/reset-wizard-config.php"),
    @("$localBase\api\get-available-filters.php", "/public_html/admin/api/get-available-filters.php"),
    @("$localBase\api\translate-text.php", "/public_html/admin/api/translate-text.php"),

    # Pages (SOLO CODICE)
    @("$localBase\pages\wizard-builder.php", "/public_html/admin/pages/wizard-builder.php"),
    @("$localBase\pages\test-wizard-access.php", "/public_html/admin/pages/test-wizard-access.php"),
    @("$localBase\pages\check-wizard-file.php", "/public_html/admin/pages/check-wizard-file.php"),

    # Modified files (SOLO CODICE)
    @("$localBase\includes\header.php", "/public_html/admin/includes/header.php"),
    @("$localBase\index.php", "/public_html/admin/index.php")
)

Write-Host "ATTENZIONE: Questo script caricherà SOLO questi file di codice:" -ForegroundColor Yellow
Write-Host ""
foreach ($fileInfo in $files) {
    $fileName = Split-Path $fileInfo[0] -Leaf
    Write-Host "  • $fileName" -ForegroundColor White
}
Write-Host ""
Write-Host "NON VERRANNO TOCCATI:" -ForegroundColor Green
Write-Host "  • Nessun file .json (dati, configurazioni, export)" -ForegroundColor Green
Write-Host "  • Nessun file nella cartella /data/" -ForegroundColor Green
Write-Host "  • Nessun file di database o backup" -ForegroundColor Green
Write-Host ""

# Conferma
$confirm = Read-Host "Vuoi procedere? (S/N)"
if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host ""
    Write-Host "Operazione annullata dall'utente." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Premi un tasto per uscire..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

Write-Host ""

# Configurazione FTP
$ftpHost = "ftp://ftp.didieffeb2b.com"
$ftpUser = "andrea@didieffeb2b.com"
Write-Host "Connessione a: $ftpHost" -ForegroundColor Cyan
Write-Host "Utente: $ftpUser" -ForegroundColor Cyan
Write-Host ""
$ftpPassword = Read-Host "Inserisci la password FTP" -AsSecureString
$ftpPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($ftpPassword))

Write-Host ""
Write-Host "Inizio caricamento..." -ForegroundColor Cyan
Write-Host ""

# Funzione per caricare un file via FTP
function Upload-FTPFile {
    param (
        [string]$LocalPath,
        [string]$RemotePath
    )

    try {
        if (-not (Test-Path $LocalPath)) {
            Write-Host "  [SKIP] File non trovato: $LocalPath" -ForegroundColor Yellow
            return $false
        }

        # Verifica che sia un file PHP
        if (-not $LocalPath.EndsWith(".php")) {
            Write-Host "  [BLOCK] Non è un file PHP: $LocalPath" -ForegroundColor Red
            return $false
        }

        $ftpUri = "$ftpHost$RemotePath"
        $webclient = New-Object System.Net.WebClient
        $webclient.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPasswordPlain)

        Write-Host "  [UPLOAD] $(Split-Path $RemotePath -Leaf)..." -NoNewline
        $webclient.UploadFile($ftpUri, $LocalPath)
        Write-Host " OK" -ForegroundColor Green

        return $true
    }
    catch {
        Write-Host " ERRORE" -ForegroundColor Red
        Write-Host "  Dettagli: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Contatori
$totalFiles = $files.Count
$uploadedFiles = 0
$skippedFiles = 0
$errorFiles = 0

# Carica ogni file
foreach ($fileInfo in $files) {
    $localPath = $fileInfo[0]
    $remotePath = $fileInfo[1]

    $result = Upload-FTPFile -LocalPath $localPath -RemotePath $remotePath

    if ($result) {
        $uploadedFiles++
    }
    elseif (Test-Path $localPath) {
        $errorFiles++
    }
    else {
        $skippedFiles++
    }
}

# Riepilogo
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Riepilogo Upload" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Totale:    $totalFiles file" -ForegroundColor White
Write-Host "  Caricati:  $uploadedFiles file" -ForegroundColor Green
Write-Host "  Saltati:   $skippedFiles file" -ForegroundColor Yellow
Write-Host "  Errori:    $errorFiles file" -ForegroundColor Red
Write-Host ""

if ($uploadedFiles -eq $totalFiles) {
    Write-Host "✓ Upload completato con successo!" -ForegroundColor Green
    Write-Host ""
    Write-Host "I tuoi dati sono al sicuro:" -ForegroundColor Green
    Write-Host "  • Configurazioni database: INTATTE" -ForegroundColor Green
    Write-Host "  • File export/prodotti: INTATTI" -ForegroundColor Green
    Write-Host "  • Traduzioni e cache: INTATTE" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prossimi passi:" -ForegroundColor Cyan
    Write-Host "  1. IMPORTANTE: Apri prima questo per verificare il file:" -ForegroundColor Yellow
    Write-Host "     https://shop.didieffeb2b.com/admin/pages/check-wizard-file.php" -ForegroundColor White
    Write-Host ""
    Write-Host "  2. Poi vai su: https://shop.didieffeb2b.com/admin/" -ForegroundColor White
    Write-Host "  3. Controlla il card 'Wizard Builder'" -ForegroundColor White
    Write-Host "  4. Clicca 'Configura Wizard Builder'" -ForegroundColor White
    Write-Host ""
    Write-Host "Se vedi ancora errori, apri:" -ForegroundColor Cyan
    Write-Host "  https://shop.didieffeb2b.com/admin/pages/test-wizard-access.php" -ForegroundColor White
}
else {
    Write-Host "! Upload completato con alcuni problemi" -ForegroundColor Yellow
    Write-Host "  Controlla i messaggi sopra per i dettagli" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Premi un tasto per uscire..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
