@echo off
echo --- Git Status ---
git --no-pager status
echo.
echo --- Git Add ---
git --no-pager add .
echo.
echo --- Git Commit ---
git --no-pager commit -m "feat: add executive leadership section"
echo.
echo --- Git Push ---
git --no-pager push origin main
echo.
echo --- Done ---
