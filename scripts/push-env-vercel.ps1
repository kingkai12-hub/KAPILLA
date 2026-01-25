
$envFile = ".env"

if (!(Test-Path $envFile)) {
    Write-Host "Error: .env file not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Checking Vercel Login Status..." -ForegroundColor Cyan
try {
    $whoami = npx vercel whoami 2>$null
    if (!$whoami) {
        Write-Host "You are not logged in. Please log in now." -ForegroundColor Yellow
        npx vercel login
    }
} catch {
    Write-Host "Vercel CLI error. Attempting login..."
    npx vercel login
}

Write-Host "Linking Project..." -ForegroundColor Cyan
npx vercel link --yes

Write-Host "Reading .env file..." -ForegroundColor Cyan
$lines = Get-Content $envFile
foreach ($line in $lines) {
    if ($line -match "^\s*#" -or $line -match "^\s*$") { continue }
    
    $parts = $line -split "=", 2
    if ($parts.Length -ne 2) { continue }
    
    $key = $parts[0].Trim()
    $value = $parts[1].Trim()
    
    # Remove quotes if present
    if ($value.StartsWith('"') -and $value.EndsWith('"')) {
        $value = $value.Substring(1, $value.Length - 2)
    }

    Write-Host "Adding $key to Vercel (Production, Preview, Development)..." -ForegroundColor Green
    
    # Pipe value to vercel env add for all environments
    # Note: 'vercel env add' reads from Stdin. 
    # We specify 'production', 'preview', 'development' by running it 3 times or checking if we can add to all.
    # Usually 'vercel env add' asks for targets if not specified.
    # We will assume we want it everywhere.
    
    # Simplest automation: Add to all three environments individually to be safe and non-interactive
    
    $value | npx vercel env add $key production --yes 2>$null
    $value | npx vercel env add $key preview --yes 2>$null
    $value | npx vercel env add $key development --yes 2>$null
}

Write-Host "All environment variables have been pushed to Vercel!" -ForegroundColor Cyan
Write-Host "Please redeploy your project for changes to take effect." -ForegroundColor Yellow
