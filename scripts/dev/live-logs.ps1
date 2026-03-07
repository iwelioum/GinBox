# ============================================================
# logs.ps1 -- Real-time monitoring for Sokoul Desktop
# ============================================================
param()
$ErrorActionPreference = "Continue"
$ProgressPreference    = "SilentlyContinue"

# -- Paths --
$ROOT      = (Get-Item "$PSScriptRoot\..\..").FullName
$DESKTOP   = "$ROOT\sokoul-desktop"
$LOGS_DIR  = "$PSScriptRoot\..\logs"
$TIMESTAMP = (Get-Date -Format "yyyyMMdd_HHmmss")
$LOG_FILE  = "$LOGS_DIR\sokoul_$TIMESTAMP.log"

if (-not (Test-Path $LOGS_DIR)) { New-Item -ItemType Directory -Path $LOGS_DIR | Out-Null }

$colorRules = [ordered]@{
    'panicked|PANIC|FATAL|CRITICAL'                   = 'Red'
    'error\[E\d{4}\]|error TS\d+'                    = 'Red'
    '\[ERR\]|\bERROR\b|\bERR\b'                      = 'Red'
    'Failed to|Cannot|CANTOPEN|unable to open'        = 'Red'
    'SQLITE.*code: \d{2}|SqliteError'                = 'Red'
    'HTTP [45]\d{2}|status: [45]\d{2}'               = 'Red'
    'Connection refused|ECONNREFUSED'                = 'Red'
    'unresolved import|Module not found'             = 'Red'
    '\bWARN\b|DeprecationWarning|deprecated'         = 'Yellow'
    'module type of file|CJS build of Vite'          = 'Yellow'
    '\[DEP\d+\]'                                     = 'Yellow'
    'SOKOUL_BACKEND_READY'                           = 'Green'
    'Database connected|migrations applied'          = 'Green'
    'ready in \d+ ms'                                = 'Green'
    '\[OK\]'                                         = 'Green'
    'VITE.*ready'                                    = 'Green'
    '^\[1\]|\[Backend\]'                             = 'Cyan'
    'INFO\s+sokoul_backend'                          = 'Cyan'
    'PRAGMA|SELECT|INSERT|UPDATE|DELETE'             = 'DarkCyan'
    '^\[0\].*VITE|Local:'                            = 'Blue'
    '^\[0\]'                                         = 'Blue'
    'Electron|Chromium|ffi-napi|anti-flicker'        = 'Magenta'
    'HTTP [23]\d{2}|GET /|POST /|PUT /|DELETE /'     = 'DarkGreen'
}

function ColorLine($line) {
    $color = 'Gray'
    foreach ($entry in $colorRules.GetEnumerator()) {
        if ($line -match $entry.Key) { $color = $entry.Value; break }
    }
    $prefix = (Get-Date -Format 'HH:mm:ss')
    Write-Host "[$prefix] $line" -ForegroundColor $color
}

Write-Host "  [...] Starting Sokoul Desktop..." -ForegroundColor DarkGray

if (-not (Test-Path $DESKTOP)) {
    Write-Host "  [ERR] sokoul-desktop not found : $DESKTOP" -ForegroundColor Red
    exit 1
}

# Launch via Start-Process with redirection to avoid event issues
# Using cmd /c to run npm and redirect to a temp file that we read
$tmpOut = [System.IO.Path]::GetTempFileName()
$tmpErr = [System.IO.Path]::GetTempFileName()

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "cmd.exe"
$psi.Arguments = "/c npm run electron:dev"
$psi.WorkingDirectory = $DESKTOP
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.CreateNoWindow = $true

$proc = New-Object System.Diagnostics.Process
$proc.StartInfo = $psi
$proc.Start() | Out-Null

# Continuous reading
try {
    while (-not $proc.HasExited) {
        if (-not $proc.StandardOutput.EndOfStream) {
            $line = $proc.StandardOutput.ReadLine()
            if ($line) { 
                ColorLine $line 
                Add-Content -Path $LOG_FILE -Value ("[OUT] $line") -Encoding UTF8
            }
        }
        if (-not $proc.StandardError.EndOfStream) {
            $line = $proc.StandardError.ReadLine()
            if ($line) { 
                ColorLine $line 
                Add-Content -Path $LOG_FILE -Value ("[ERR] $line") -Encoding UTF8
            }
        }
        Start-Sleep -Milliseconds 10
    }
} finally {
    if (-not $proc.HasExited) { $proc.Kill() }
    Write-Host "  Full log : $LOG_FILE"
}
