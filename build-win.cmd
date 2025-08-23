@echo off
setlocal enabledelayedexpansion

echo Cleaning up...
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul

set NODE_ENV=production
set NPM_CONFIG_PLATFORM=linux

echo Installing dependencies...
call npm install --no-optional --legacy-peer-deps --force

if !errorlevel! neq 0 (
    echo Failed to install dependencies
    exit /b 1
)

echo Building application...
call npm run build

if !errorlevel! equ 0 (
    echo Build completed successfully!
    exit /b 0
) else (
    echo Build failed!
    exit /b 1
)
