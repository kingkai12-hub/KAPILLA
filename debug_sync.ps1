
$logFile = "c:\Users\HP\Desktop\MANAGEMENT SYSTEM\kapilla-logistics\sync_debug_log.txt"
Start-Transcript -Path $logFile -Append

Write-Host "--- GIT REMOTE INFO ---"
git remote -v
Write-Host "--- GIT BRANCH INFO ---"
git branch -vv
Write-Host "--- GIT STATUS ---"
git status

Write-Host "--- ADDING MARKER FILE ---"
git add sync_check.txt

Write-Host "--- COMMITTING ---"
git commit -m "debug: sync check marker"

Write-Host "--- PUSHING TO ORIGIN MAIN ---"
# Capture stderr too
git push origin main 2>&1 | Write-Host

Write-Host "--- VERCEL LINK CHECK ---"
npx vercel project ls 2>&1 | Write-Host

Stop-Transcript
