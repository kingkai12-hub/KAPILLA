@echo off
echo Generating Prisma Client...
call .\node_modules\.bin\prisma.cmd generate
if %errorlevel% neq 0 (
    echo Prisma generate failed
    exit /b %errorlevel%
)

echo Building Next.js App...
call .\node_modules\.bin\next.cmd build
if %errorlevel% neq 0 (
    echo Next build failed
    exit /b %errorlevel%
)

echo Build Successful!
pause
