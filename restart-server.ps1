# Restart Development Server Script
# This script properly stops all Node processes and restarts the dev server

Write-Host "Restarting Development Server..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop all Node processes
Write-Host "Step 1: Stopping all Node.js processes..." -ForegroundColor Yellow
try {
    taskkill /F /IM node.exe 2>$null
    Write-Host "Node processes stopped" -ForegroundColor Green
} catch {
    Write-Host "No Node processes to stop" -ForegroundColor Yellow
}

Write-Host ""
Start-Sleep -Seconds 2

# Step 2: Regenerate Prisma Client
Write-Host "Step 2: Regenerating Prisma Client..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "Prisma Client generated" -ForegroundColor Green
} catch {
    Write-Host "Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}

Write-Host ""
Start-Sleep -Seconds 1

# Step 3: Start development server
Write-Host "Step 3: Starting development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Server starting at http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

npm run dev
