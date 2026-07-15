param(
    [string]$ProjectPath = "C:\FalseAccess"
)

$ErrorActionPreference = "Stop"

Write-Host "[FALSE ACCESS] Applying npm ci fix..." -ForegroundColor Cyan

$PatchRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not (Test-Path $ProjectPath)) {
    throw "Project folder not found: $ProjectPath"
}

New-Item -ItemType Directory -Force -Path (Join-Path $ProjectPath ".github\workflows") | Out-Null
Copy-Item -Force (Join-Path $PatchRoot "package-lock.json") (Join-Path $ProjectPath "package-lock.json")
Copy-Item -Force (Join-Path $PatchRoot ".npmrc") (Join-Path $ProjectPath ".npmrc")
Copy-Item -Force (Join-Path $PatchRoot ".github\workflows\deploy.yml") (Join-Path $ProjectPath ".github\workflows\deploy.yml")

Set-Location $ProjectPath

if (Select-String -Path "package-lock.json" -Pattern "applied-caas-gateway" -Quiet) {
    throw "Internal npm registry URL still exists in package-lock.json"
}

Write-Host "[1/4] Cleaning dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
}

Write-Host "[2/4] Running npm ci..." -ForegroundColor Yellow
npm ci --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw "npm ci failed with exit code $LASTEXITCODE" }

Write-Host "[3/4] Running production build..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { throw "npm run build failed with exit code $LASTEXITCODE" }

Write-Host "[4/4] Committing and pushing..." -ForegroundColor Yellow
git add package-lock.json .npmrc .github/workflows/deploy.yml
$changes = git status --porcelain
if ($changes) {
    git commit -m "fix: use public npm registry in GitHub Actions"
}

git push origin main
if ($LASTEXITCODE -ne 0) { throw "git push failed with exit code $LASTEXITCODE" }

Write-Host "Done. GitHub Actions should run npm ci against registry.npmjs.org." -ForegroundColor Green
