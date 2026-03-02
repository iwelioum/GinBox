# ============================================================
# diag.ps1 -- Diagnostic complet Sokoul Desktop
# Usage : 08_diag.bat  OR  powershell -ExecutionPolicy Bypass -File diag.ps1
# ============================================================
param()
$ErrorActionPreference = "Continue"
$ProgressPreference    = "SilentlyContinue"

$script:errN  = 0
$script:warnN = 0
$script:okN   = 0

function hdr($t) {
    Write-Host ""
    Write-Host ("  " + "=" * 58) -ForegroundColor DarkCyan
    Write-Host "  >>> $t" -ForegroundColor Cyan
    Write-Host ("  " + "=" * 58) -ForegroundColor DarkCyan
}
function OK   { param($m) Write-Host "  [OK]   $m" -ForegroundColor Green;  $script:okN++   }
function WARN { param($m) Write-Host "  [WARN] $m" -ForegroundColor Yellow; $script:warnN++ }
function ERR  { param($m) Write-Host "  [ERR]  $m" -ForegroundColor Red;    $script:errN++  }
function INFO { param($m) Write-Host "  [...]  $m" -ForegroundColor DarkGray }
function SUB  { param($m) Write-Host "         $m" -ForegroundColor DarkGray }

# -- Paths --
$ROOT        = (Get-Item "$PSScriptRoot\..").FullName
$BACKEND     = "$ROOT\sokoul-backend"
$DESKTOP     = "$ROOT\sokoul-desktop"
$ENV_FILE    = "$BACKEND\.env"
$BACKEND_EXE = "$BACKEND\target\debug\sokoul-backend.exe"
$MPV_EXE     = "$DESKTOP\mpv\mpv.exe"
$NODE_MODS   = "$DESKTOP\node_modules"
$DB_PATH     = "$BACKEND\sokoul_desktop.db"
$DB_WAL      = "$BACKEND\sokoul_desktop.db-wal"
$MIGRATIONS  = "$BACKEND\migrations"

# -- Banner --
Write-Host ""
Write-Host "  +--------------------------------------------------+" -ForegroundColor DarkCyan
Write-Host "  |     SOKOUL DESKTOP -- DIAGNOSTIC SYSTEME        |" -ForegroundColor Cyan
Write-Host "  +--------------------------------------------------+" -ForegroundColor DarkCyan
Write-Host "  Racine : $ROOT" -ForegroundColor DarkGray
Write-Host "  Date   : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor DarkGray


# ============================================================
hdr "1 / 8   OUTILS SYSTEME"
# ============================================================

try {
    $v   = (node -v 2>&1).ToString().Trim()
    $maj = [int]($v -replace 'v(\d+).*', '$1')
    if ($maj -ge 18) { OK "Node.js $v" }
    else             { WARN "Node.js $v -- v18+ recommande" }
} catch {
    ERR "Node.js introuvable -- installer nodejs.org"
}

try   { $v = (npm -v 2>&1).ToString().Trim(); OK "npm v$v" }
catch { ERR "npm introuvable" }

try   { $v = (cargo --version 2>&1).ToString().Trim(); OK $v }
catch { WARN "cargo introuvable -- rebuild du backend impossible" }

$sqlite3Bin = Get-Command sqlite3.exe -ErrorAction SilentlyContinue
if ($sqlite3Bin) {
    $sv = (sqlite3 --version 2>&1 | Select-Object -First 1).ToString().Trim()
    OK "sqlite3 $sv"
} else {
    INFO "sqlite3.exe absent -- inspection DB avancee desactivee"
    INFO "  Telecharger : sqlite.org/download.html (sqlite-tools-win-x64)"
}

$curlBin = Get-Command curl.exe -ErrorAction SilentlyContinue
if ($curlBin) { OK "curl.exe disponible" }
else          { INFO "curl.exe absent -- tests API via Invoke-WebRequest" }


# ============================================================
hdr "2 / 8   FICHIERS CLES"
# ============================================================

if (Test-Path $ENV_FILE) { OK ".env trouve : $ENV_FILE" }
else                     { ERR ".env ABSENT -- $ENV_FILE" }

if (Test-Path $BACKEND_EXE) {
    $mb = [math]::Round((Get-Item $BACKEND_EXE).Length / 1MB, 1)
    $dt = (Get-Item $BACKEND_EXE).LastWriteTime.ToString("yyyy-MM-dd HH:mm")
    OK "sokoul-backend.exe -- $mb MB  (compile $dt)"
} else {
    ERR "sokoul-backend.exe ABSENT"
    SUB "-> cargo build --manifest-path=`"$BACKEND\Cargo.toml`""
}

if (Test-Path $MPV_EXE) { OK "mpv.exe trouve" }
else {
    ERR "mpv.exe ABSENT -- lecteur video non fonctionnel"
    SUB "-> github.com/shinchiro/mpv-winbuild-cmake/releases"
    SUB "-> Placer mpv.exe dans : $DESKTOP\mpv\"
}

if (Test-Path $NODE_MODS) {
    $pkgCount = (Get-ChildItem $NODE_MODS -Directory -ErrorAction SilentlyContinue).Count
    OK "node_modules -- $pkgCount paquets"
} else {
    WARN "node_modules absent"
    SUB "-> npm install dans $DESKTOP"
}

if (Test-Path $MIGRATIONS) {
    $mCount = (Get-ChildItem "$MIGRATIONS\*.sql" -ErrorAction SilentlyContinue).Count
    OK "migrations/ -- $mCount fichier(s) SQL"
} else {
    ERR "Dossier migrations/ absent : $MIGRATIONS"
}


# ============================================================
hdr "3 / 8   VARIABLES D'ENVIRONNEMENT (.env)"
# ============================================================

if (Test-Path $ENV_FILE) {
    $lines   = Get-Content $ENV_FILE | Where-Object { $_ -notmatch '^\s*#' -and $_ -match '=' }
    $envVars = @{}
    foreach ($l in $lines) {
        if ($l -match '^([^=]+)=(.*)$') {
            $envVars[$Matches[1].Trim()] = $Matches[2].Trim()
        }
    }

    # DATABASE_URL
    $dbUrl = $envVars['DATABASE_URL']
    if (-not $dbUrl) {
        ERR "DATABASE_URL manquante"
    } elseif ($dbUrl -match '^sqlite://') {
        ERR "DATABASE_URL utilise sqlite:// -> SQLite lit le hostname comme chemin -> CANTOPEN"
        SUB "-> Corriger : DATABASE_URL=sqlite:./sokoul_desktop.db?mode=rwc"
    } elseif ($dbUrl -notmatch '\?mode=rwc') {
        WARN "DATABASE_URL sans ?mode=rwc -- la DB ne sera pas creee si absente"
        SUB "  Actuel  : $dbUrl"
        SUB "  Correct : $dbUrl?mode=rwc"
    } else {
        OK "DATABASE_URL = $dbUrl"
    }

    # Cles obligatoires
    @('TMDB_API_KEY','REALDEBRID_API_TOKEN','FANART_API_KEY',
      'TRAKT_CLIENT_ID','TRAKT_CLIENT_SECRET','SOKOUL_ENCRYPTION_KEY') | ForEach-Object {
        $val = $envVars[$_]
        if (-not $val) {
            ERR "$_ : NON DEFINIE"
        } else {
            $mask = $val.Substring(0, [Math]::Min(4, $val.Length)) + '****'
            OK "$_ = $mask"
        }
    }

    # Cles optionnelles
    @('PROWLARR_URL','PROWLARR_API_KEY','FLARESOLVERR_URL') | ForEach-Object {
        $val = $envVars[$_]
        if (-not $val) { WARN "$_ non definie (fonctions associees desactivees)" }
        else           { OK "$_ = $val" }
    }

    # SERVER_PORT
    $port = $envVars['SERVER_PORT']
    if ($port -ne '3000') { WARN "SERVER_PORT=$port (frontend attend 3000)" }
    else                  { OK "SERVER_PORT=3000" }

} else {
    ERR "Impossible de lire .env -- verifier les permissions"
}


# ============================================================
hdr "4 / 8   BASE DE DONNEES"
# ============================================================

if (Test-Path $DB_PATH) {
    $kb = [math]::Round((Get-Item $DB_PATH).Length / 1KB, 1)
    $dt = (Get-Item $DB_PATH).LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
    OK "sokoul_desktop.db -- $kb KB -- modifie : $dt"

    if (Test-Path $DB_WAL) { INFO "WAL actif (.db-wal present)" }
    else                   { INFO "Pas de WAL (DB proprement fermee ou vide)" }

    if ($sqlite3Bin) {
        try {
            $tables = & sqlite3 $DB_PATH ".tables" 2>&1
            OK "Tables : $($tables -join '  ')"

            $profiles = & sqlite3 $DB_PATH "SELECT COUNT(*) FROM profiles;" 2>&1
            OK "Profils en base : $profiles"

            $migs = & sqlite3 $DB_PATH "SELECT COUNT(*) FROM _sqlx_migrations;" 2>&1
            OK "Migrations appliquees : $migs"

            $pb = & sqlite3 $DB_PATH "SELECT COUNT(*) FROM playback_entries;" 2>&1
            INFO "Entrees playback : $pb"

            $ls = & sqlite3 $DB_PATH "SELECT COUNT(*) FROM user_lists;" 2>&1
            INFO "Listes utilisateur : $ls"
        } catch {
            WARN "sqlite3 query echouee : $_"
        }
    } else {
        INFO "sqlite3 indisponible -- inspecter manuellement si necessaire"
    }
} else {
    WARN "sokoul_desktop.db absent -- sera cree au premier demarrage du backend"
    INFO "  Chemin attendu : $DB_PATH"
    INFO "  Demarrer le backend une fois pour initialiser les migrations"
}


# ============================================================
hdr "5 / 8   API BACKEND (127.0.0.1:3000)"
# ============================================================

$port3000 = netstat -an 2>$null | Select-String "127\.0\.0\.1:3000\s"

if ($port3000) {
    OK "Port 3000 ouvert -- backend actif"

    try {
        $r = Invoke-WebRequest "http://127.0.0.1:3000/health" -TimeoutSec 3 -UseBasicParsing -EA Stop
        OK "/health -> HTTP $($r.StatusCode) | $($r.Content.Trim())"
    } catch {
        ERR "/health inaccessible : $($_.Exception.Message)"
    }

    try {
        $r     = Invoke-WebRequest "http://127.0.0.1:3000/profiles" -TimeoutSec 3 -UseBasicParsing -EA Stop
        $count = ($r.Content | ConvertFrom-Json).Count
        OK "/profiles -> HTTP $($r.StatusCode) | $count profil(s)"
    } catch {
        ERR "/profiles inaccessible : $($_.Exception.Message)"
    }

    try {
        $r     = Invoke-WebRequest "http://127.0.0.1:3000/catalog/movie/popular" -TimeoutSec 5 -UseBasicParsing -EA Stop
        $metas = ($r.Content | ConvertFrom-Json).metas.Count
        OK "/catalog/movie/popular -> HTTP $($r.StatusCode) | $metas films"
    } catch {
        WARN "/catalog/movie/popular -> $($_.Exception.Message)"
    }

    try {
        $r = Invoke-WebRequest "http://127.0.0.1:3000/lists?profile_id=1" -TimeoutSec 3 -UseBasicParsing -EA Stop
        OK "/lists?profile_id=1 -> HTTP $($r.StatusCode)"
    } catch {
        WARN "/lists non accessible : $($_.Exception.Message)"
    }

} else {
    WARN "Port 3000 FERME -- backend non actif"
    INFO "  Normal si Sokoul n'est pas en cours d'execution"
    INFO "  -> Lancer 05_run_all.bat ou 02_run_backend.bat"
}


# ============================================================
hdr "6 / 8   LECTEUR MPV"
# ============================================================

if (Test-Path $MPV_EXE) {
    try {
        $mpvVer = (& $MPV_EXE --version 2>&1 | Select-Object -First 1).ToString().Trim()
        OK "mpv.exe -- $mpvVer"
        INFO "  Chemin : $MPV_EXE"
    } catch {
        OK "mpv.exe present (impossible de lire la version)"
    }

    $mpvManager = "$DESKTOP\electron\mpv-manager.js"
    if (Test-Path $mpvManager) { OK "mpv-manager.js present" }
    else                       { ERR "mpv-manager.js ABSENT : $mpvManager" }
} else {
    ERR "mpv.exe ABSENT -- la lecture video est impossible"
    SUB "  -> github.com/shinchiro/mpv-winbuild-cmake/releases"
    SUB "  -> Extraire mpv.exe vers $DESKTOP\mpv\"
}


# ============================================================
hdr "7 / 8   FRONTEND TYPESCRIPT"
# ============================================================

if (Test-Path $NODE_MODS) {
    Push-Location $DESKTOP
    try {
        $tscOut    = & npx tsc --noEmit 2>&1
        $tscErrors = @($tscOut | Where-Object { $_ -match 'error TS' })

        if ($tscErrors.Count -eq 0) {
            OK "TypeScript -- 0 erreur de compilation"
        } else {
            ERR "TypeScript -- $($tscErrors.Count) erreur(s)"
            $tscErrors | Select-Object -First 20 | ForEach-Object {
                Write-Host "  |  $_" -ForegroundColor DarkRed
            }
            if ($tscErrors.Count -gt 20) {
                Write-Host "  |  ... +$($tscErrors.Count - 20) erreur(s) supplementaires" -ForegroundColor DarkRed
            }
        }
    } catch {
        WARN "Impossible de lancer tsc : $_"
    } finally {
        Pop-Location
    }
} else {
    WARN "node_modules absent -- TypeScript check ignore"
}

$criticalFiles = @(
    "src\App.tsx",
    "src\pages\ProfileSelectPage.tsx",
    "src\pages\HomePage.tsx",
    "src\pages\PlayerPage.tsx",
    "src\hooks\useMpv.ts",
    "src\store\playerStore.ts",
    "src\api\client.ts",
    "electron\main.js",
    "electron\backend-manager.js",
    "electron\mpv-manager.js",
    "electron\preload.js"
)
$missing = @()
foreach ($f in $criticalFiles) {
    if (-not (Test-Path "$DESKTOP\$f")) { $missing += $f }
}
if ($missing.Count -eq 0) {
    OK "Fichiers sources critiques -- tous presents ($($criticalFiles.Count))"
} else {
    ERR "Fichiers sources manquants :"
    $missing | ForEach-Object { SUB "  -> $_" }
}


# ============================================================
hdr "8 / 8   RESUME"
# ============================================================

Write-Host ""
Write-Host ("  " + "-" * 54) -ForegroundColor DarkGray
$totals = "  Resultat :  [OK] $($script:okN)   [WARN] $($script:warnN)   [ERR] $($script:errN)"
if ($script:errN -gt 0) {
    Write-Host $totals -ForegroundColor Red
} elseif ($script:warnN -gt 0) {
    Write-Host $totals -ForegroundColor Yellow
} else {
    Write-Host $totals -ForegroundColor Green
}
Write-Host ("  " + "-" * 54) -ForegroundColor DarkGray
Write-Host ""

if ($script:errN -eq 0 -and $script:warnN -eq 0) {
    Write-Host "  [OK] Sokoul est pret. Lancer : 05_run_all.bat" -ForegroundColor Green
} else {
    if ($script:errN -gt 0) {
        Write-Host "  [ERR] $($script:errN) ERREUR(S) bloquante(s) -- corriger en priorite." -ForegroundColor Red
    }
    if ($script:warnN -gt 0) {
        Write-Host "  [WARN] $($script:warnN) AVERTISSEMENT(S) -- fonctions reduites possibles." -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "  Guides :" -ForegroundColor Cyan
    Write-Host "   * Base de donnees     -> 01_reset_db.bat" -ForegroundColor DarkGray
    Write-Host "   * Logs en temps reel  -> 09_logs.bat" -ForegroundColor DarkGray
    Write-Host "   * Prerequis manquants -> 00_check_prereqs.bat" -ForegroundColor DarkGray
}
Write-Host ""
