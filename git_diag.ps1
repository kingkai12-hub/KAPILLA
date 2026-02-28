
Write-Host "=== GIT DIAGNOSTIC START ==="
Write-Host "1. Checking Git Status:"
git status
Write-Host "`n2. Checking Branch Info:"
git branch -vv
Write-Host "`n3. Checking Remote Info:"
git remote -v
Write-Host "`n4. Last 3 Local Commits:"
git log -n 3 --oneline
Write-Host "`n5. Checking Remote Head (Origin/Main):"
git ls-remote origin main
Write-Host "=== GIT DIAGNOSTIC END ==="
