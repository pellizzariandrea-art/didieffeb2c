# ==========================================
# SCRIPT DI DEPLOY AUTOMATICO - SITEGROUND
# ==========================================
#
# Questo script carica automaticamente i file della cartella admin/
# sul server SiteGround via FTP
#
# CONFIGURAZIONE SICURA:
# 1. Imposta la password una volta (solo la prima volta):
#    $env:SITEGROUND_FTP_PASSWORD = "tua-password-qui"
#    [System.Environment]::SetEnvironmentVariable('SITEGROUND_FTP_PASSWORD', 'tua-password', 'User')
#
# 2. Esegui questo script:
#    .\deploy-to-siteground.ps1
#
# ==========================================

# Configurazione FTP (da SiteGround)
$FTP_HOST = "ftp.didieffeb2b.com"
$FTP_USER = "andrea@didieffeb2b.com"
$FTP_PORT = 21
$REMOTE_PATH = "/public_html/admin"  # Path remoto dove caricare i file
$LOCAL_PATH = Join-Path $PSScriptRoot "admin"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY AUTOMATICO SITEGROUND" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verifica password
$FTP_PASSWORD = $env:SITEGROUND_FTP_PASSWORD
if (-not $FTP_PASSWORD) {
    Write-Host "ERRORE: Password FTP non configurata!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Configura la password eseguendo:" -ForegroundColor Yellow
    Write-Host '  [System.Environment]::SetEnvironmentVariable("SITEGROUND_FTP_PASSWORD", "tua-password", "User")' -ForegroundColor White
    Write-Host ""
    Write-Host "Oppure temporaneamente per questa sessione:" -ForegroundColor Yellow
    Write-Host '  $env:SITEGROUND_FTP_PASSWORD = "tua-password"' -ForegroundColor White
    Write-Host ""
    exit 1
}

# Verifica cartella locale
if (-not (Test-Path $LOCAL_PATH)) {
    Write-Host "ERRORE: Cartella admin/ non trovata in: $LOCAL_PATH" -ForegroundColor Red
    exit 1
}

Write-Host "Configurazione:" -ForegroundColor Green
Write-Host "  Host:     $FTP_HOST" -ForegroundColor White
Write-Host "  User:     $FTP_USER" -ForegroundColor White
Write-Host "  Porta:    $FTP_PORT" -ForegroundColor White
Write-Host "  Locale:   $LOCAL_PATH" -ForegroundColor White
Write-Host "  Remoto:   $REMOTE_PATH" -ForegroundColor White
Write-Host ""

# Chiedi conferma
$confirm = Read-Host "Vuoi procedere con il deploy? (s/n)"
if ($confirm -ne 's' -and $confirm -ne 'S') {
    Write-Host "Deploy annullato." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Caricamento file in corso..." -ForegroundColor Cyan

# Funzione per caricare file via FTP usando WebClient
function Upload-FileViaFTP {
    param(
        [string]$LocalFile,
        [string]$RemoteFile
    )

    try {
        $webclient = New-Object System.Net.WebClient
        $webclient.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASSWORD)

        $uri = "ftp://$FTP_HOST$RemoteFile"

        Write-Host "  ↗ $RemoteFile" -ForegroundColor Gray
        $webclient.UploadFile($uri, $LocalFile)

        return $true
    }
    catch {
        Write-Host "  ✗ ERRORE: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Funzione per creare directory remote
function Create-FTPDirectory {
    param([string]$RemoteDir)

    try {
        $webclient = New-Object System.Net.WebClient
        $webclient.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASSWORD)

        $uri = "ftp://$FTP_HOST$RemoteDir"
        $request = [System.Net.FtpWebRequest]::Create($uri)
        $request.Credentials = $webclient.Credentials
        $request.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory

        $response = $request.GetResponse()
        $response.Close()

        return $true
    }
    catch {
        # Directory potrebbe già esistere, ignora errore
        return $false
    }
}

# Contatori
$uploadedFiles = 0
$failedFiles = 0
$skippedFiles = 0

# File e cartelle da escludere
$excludePatterns = @(
    "*.log",
    "*.bak",
    "*_temp.*",
    "ai-descriptions",
    "logs",
    "cache"
)

# Funzione per verificare se un file deve essere escluso
function Should-Exclude {
    param([string]$FilePath)

    foreach ($pattern in $excludePatterns) {
        if ($FilePath -like "*$pattern*") {
            return $true
        }
    }
    return $false
}

# Carica tutti i file ricorsivamente
Get-ChildItem -Path $LOCAL_PATH -Recurse -File | ForEach-Object {
    $localFile = $_.FullName
    $relativePath = $_.FullName.Substring($LOCAL_PATH.Length).Replace('\', '/')
    $remoteFile = "$REMOTE_PATH$relativePath"

    # Verifica esclusioni
    if (Should-Exclude $relativePath) {
        Write-Host "  ⊘ Ignorato: $relativePath" -ForegroundColor DarkGray
        $skippedFiles++
        return
    }

    # Crea directory remote se necessario
    $remoteDir = [System.IO.Path]::GetDirectoryName($remoteFile).Replace('\', '/')
    if ($remoteDir -ne $REMOTE_PATH) {
        Create-FTPDirectory -RemoteDir $remoteDir | Out-Null
    }

    # Carica file
    if (Upload-FileViaFTP -LocalFile $localFile -RemoteFile $remoteFile) {
        $uploadedFiles++
    }
    else {
        $failedFiles++
    }
}

# Riepilogo
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY COMPLETATO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  File caricati:  $uploadedFiles" -ForegroundColor Green
Write-Host "  File ignorati:  $skippedFiles" -ForegroundColor Yellow
Write-Host "  Errori:         $failedFiles" -ForegroundColor $(if ($failedFiles -gt 0) { "Red" } else { "Gray" })
Write-Host ""

if ($failedFiles -gt 0) {
    Write-Host "ATTENZIONE: Alcuni file non sono stati caricati!" -ForegroundColor Red
    Write-Host "Verifica i messaggi di errore sopra." -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Deploy completato con successo!" -ForegroundColor Green
Write-Host "  Verifica su: https://shop.didieffeb2b.com/admin/" -ForegroundColor Cyan
Write-Host ""
