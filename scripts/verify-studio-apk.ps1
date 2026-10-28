param(
  [Parameter(Mandatory=$true)][string]$Apk,
  [string]$PreviousApk = "artifacts/artspace-ar-wall-fix.apk",
  [string]$BuildTools = "$env:LOCALAPPDATA/Android/Sdk/build-tools/36.0.0"
)
$ErrorActionPreference = "Stop"
$apkPath = (Resolve-Path -LiteralPath $Apk).Path
$signer = Join-Path $BuildTools "apksigner.bat"
$aapt = Join-Path $BuildTools "aapt.exe"
$signature = & $signer verify --verbose --print-certs $apkPath 2>&1
$signatureCode = $LASTEXITCODE
$signature | Set-Content -Encoding utf8 docs/evidence/placed-apk-signature.log
if ($signatureCode -ne 0) { throw "APK signature verification failed." }
$certPattern = 'Signer #1 certificate SHA-256 digest: ([a-fA-F0-9]+)'
$certificate = [regex]::Match(($signature -join "`n"), $certPattern).Groups[1].Value
if (-not $certificate) { throw "Signing certificate could not be read." }
$oldSignature = & $signer verify --print-certs (Resolve-Path -LiteralPath $PreviousApk).Path 2>&1
if ($LASTEXITCODE -ne 0) { throw "Previous APK could not be verified." }
$oldCertificate = [regex]::Match(($oldSignature -join "`n"), $certPattern).Groups[1].Value
if ($oldCertificate -ne $certificate) { throw "Signing certificate differs from the previous installation." }
$badging = & $aapt dump badging $apkPath 2>&1
if ($LASTEXITCODE -ne 0) { throw "APK metadata cannot be read." }
$permissions = & $aapt dump permissions $apkPath 2>&1
if ($LASTEXITCODE -ne 0) { throw "APK permissions cannot be read." }
$badging | Set-Content -Encoding utf8 docs/evidence/placed-apk-badging.log
$permissions | Set-Content -Encoding utf8 docs/evidence/placed-apk-permissions.log
if (($badging -join "`n") -notmatch "package: name='com.artspacear.mma301'") { throw "Unexpected package name." }
if (($permissions -join "`n") -notmatch "name='android.permission.CAMERA'") { throw "Camera permission is missing." }
if (($permissions -join "`n") -match "name='android.permission.RECORD_AUDIO'") { throw "Photo-only app unexpectedly requests microphone access." }

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($apkPath)
try {
  $bundleEntry = $zip.GetEntry("assets/index.android.bundle")
  if (-not $bundleEntry) { throw "Standalone JavaScript bundle missing." }
  $stream = $bundleEntry.Open()
  $memory = [System.IO.MemoryStream]::new()
  try { $stream.CopyTo($memory); $bundle = [System.Text.Encoding]::Latin1.GetString($memory.ToArray()) }
  finally { $stream.Dispose(); $memory.Dispose() }
  $markers = [ordered]@{}
  foreach ($marker in @("View on room", "Shadow offset", "Shadow softness", "Tap artwork to edit", "Apply artwork size", "Occlusion on", "Protect foreground objects", "Edit & save this wall", "Export / share PNG")) {
    $markers[$marker] = $bundle.Contains($marker)
    if (-not $markers[$marker]) { throw "Current studio marker missing: $marker" }
  }
  $nativeAR = @($zip.Entries | Where-Object { $_.FullName -match '^lib/(arm64-v8a|armeabi-v7a)/.*(viro|arcore).*\.so$' } | ForEach-Object { $_.FullName })
  if ($nativeAR.Count -lt 2) { throw "Native ARM AR libraries missing." }
  $rooms = @($zip.Entries | Where-Object { $_.FullName -match '(living|bedroom|gallery).*\.png$' } | ForEach-Object { $_.FullName })
  $report = [ordered]@{
    utc = [DateTime]::UtcNow.ToString("o")
    pass = $true
    apk = $apkPath
    bytes = (Get-Item -LiteralPath $apkPath).Length
    sha256 = (Get-FileHash -LiteralPath $apkPath -Algorithm SHA256).Hash
    signatureExitCode = $signatureCode
    certificateMatchesPrevious = $true
    certificateSha256 = $certificate
    cameraPermission = $true
    microphonePermission = $false
    studioMarkers = $markers
    nativeARLibraries = $nativeAR
    sampleRoomAssets = $rooms
    hardwareAcceptance = "UNVERIFIED"
  }
  $report | ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 docs/evidence/placed-apk-verification.json
  $report | Select-Object pass,bytes,sha256,certificateMatchesPrevious,hardwareAcceptance | Format-List
} finally { $zip.Dispose() }
