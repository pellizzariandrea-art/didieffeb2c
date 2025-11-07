# Script PowerShell per caricare i file del Wizard su FTP
# Usage: .\upload-wizard-files.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Upload Wizard Files to FTP" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Configurazione FTP
$ftpHost = "ftp://ftp.didieffeb2b.com"
$ftpUser = "andrea@didieffeb2b.com"
$ftpPassword = Read-Host "Inserisci la password FTP" -AsSecureString
$ftpPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($ftpPassword))

# Percorso locale base
$localBase = "C:\users\pelli\claude\ecommerce\admin"

# Lista file da caricare: [percorso_locale, percorso_remoto]
$files = @(
    # API Files
    @("$localBase\api\get-wizard-config.php", "/public_html/admin/api/get-wizard-config.php"),
    @("$localBase\api\save-wizard-config.php", "/public_html/admin/api/save-wizard-config.php"),
    @("$localBase\api\get-translation-settings.php", "/public_html/admin/api/get-translation-settings.php"),
    @("$localBase\api\reset-wizard-config.php", "/public_html/admin/api/reset-wizard-config.php"),
    @("$localBase\api\get-available-filters.php", "/public_html/admin/api/get-available-filters.php"),

    # Pages
    @("$localBase\pages\wizard-builder.php", "/public_html/admin/pages/wizard-builder.php"),
    @("$localBase\pages\test-wizard-access.php", "/public_html/admin/pages/test-wizard-access.php"),

    # Modified files
    @("$localBase\includes\header.php", "/public_html/admin/includes/header.php"),
    @("$localBase\index.php", "/public_html/admin/index.php")
)

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

Write-Host "Trovati $totalFiles file da caricare" -ForegroundColor Cyan
Write-Host ""

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
    Write-Host "Prossimi passi:" -ForegroundColor Cyan
    Write-Host "  1. Vai su: https://shop.didieffeb2b.com/admin/" -ForegroundColor White
    Write-Host "  2. Controlla il card 'Wizard Builder'" -ForegroundColor White
    Write-Host "  3. Clicca 'Configura Wizard Builder'" -ForegroundColor White
    Write-Host ""
    Write-Host "Se vedi errori, apri:" -ForegroundColor Cyan
    Write-Host "  https://shop.didieffeb2b.com/admin/pages/test-wizard-access.php" -ForegroundColor White
}
else {
    Write-Host "! Upload completato con alcuni problemi" -ForegroundColor Yellow
    Write-Host "  Controlla i messaggi sopra per i dettagli" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Premi un tasto per uscire..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
