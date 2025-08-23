@echo off
echo Cleaning up...
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul
del pnpm-lock.yaml 2>nul
del yarn.lock 2>nul

echo Clearing npm cache...
npm cache clean --force

echo Installing dependencies...
call npm install --no-optional --legacy-peer-deps --force

if %errorlevel% neq 0 (
    echo Installation failed, trying with --force...
    call npm install --legacy-peer-deps --force
)

if %errorlevel% equ 0 (
    echo Installation completed successfully!
) else (
    echo Installation failed. Please check the error messages above.
)

pause
