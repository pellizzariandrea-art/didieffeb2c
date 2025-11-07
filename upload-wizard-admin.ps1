# Script per caricare i file admin del wizard modificati
# Solo file PHP admin, NO dati

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "  Upload Wizard Admin Files" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$localBase = "C:\users\pelli\claude\ecommerce"

$files = @(
    @("$localBase\admin\pages\wizard-builder.php", "/public_html/admin/pages/wizard-builder.php"),
    @("$localBase\admin\data\wizard-config.json", "/public_html/admin/data/wizard-config.json")
)

Write-Host "File da caricare:" -ForegroundColor Yellow
foreach ($fileInfo in $files) {
    $fileName = Split-Path $fileInfo[0] -Leaf
    Write-Host "  • $fileName" -ForegroundColor White
}
Write-Host ""

$confirm = Read-Host "Vuoi procedere? (S/N)"
if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "Operazione annullata." -ForegroundColor Yellow
    exit
}

$ftpHost = "ftp://ftp.didieffeb2b.com"
$ftpUser = "andrea@didieffeb2b.com"
Write-Host ""
Write-Host "Connessione a: $ftpHost" -ForegroundColor Cyan
$ftpPassword = Read-Host "Password FTP" -AsSecureString
$ftpPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($ftpPassword))

Write-Host ""
Write-Host "Caricamento..." -ForegroundColor Cyan

function Upload-FTPFile {
    param ([string]$LocalPath, [string]$RemotePath)

    try {
        if (-not (Test-Path $LocalPath)) {
            Write-Host "  [SKIP] $LocalPath" -ForegroundColor Yellow
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
        Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

$uploaded = 0
foreach ($fileInfo in $files) {
    if (Upload-FTPFile -LocalPath $fileInfo[0] -RemotePath $fileInfo[1]) {
        $uploaded++
    }
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "  Completato: $uploaded/$($files.Count) file" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ora apri: https://shop.didieffeb2b.com/admin/pages/wizard-builder.php" -ForegroundColor White
Write-Host ""
