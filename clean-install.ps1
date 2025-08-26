# Stop any running Node processes
Write-Host "Stopping any running Node processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Clean up directories and files
Write-Host "Cleaning up project directories..." -ForegroundColor Yellow
$pathsToRemove = @(
    "node_modules",
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    ".svelte-kit",
    ".turbo",
    ".next",
    "dist",
    "build"
)

foreach ($path in $pathsToRemove) {
    if (Test-Path $path) {
        try {
            Remove-Item -Recurse -Force $path -ErrorAction Stop
            Write-Host "Removed: $path" -ForegroundColor Green
        } catch {
            Write-Host "Failed to remove $path. It may be locked by another process." -ForegroundColor Red
        }
    }
}

# Clear npm cache
Write-Host "Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Set environment variables
$env:NODE_ENV = "development"
$env:NPM_CONFIG_LEGACY_PEER_DEPS = "true"
$env:NPM_CONFIG_OPTIONAL = "false"

# Install Node.js 18.17.0 if not already installed
if (-not (Get-Command nvm -ErrorAction SilentlyContinue)) {
    Write-Host "nvm not found. Please install nvm-windows first." -ForegroundColor Red
    exit 1
}

# Use Node.js 18.17.0
nvm install 18.17.0
nvm use 18.17.0

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install --no-optional --legacy-peer-deps

# Check if installation was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "Dependency installation failed. Trying with --force..." -ForegroundColor Red
    npm install --legacy-peer-deps --force
}

# Run a production build as a test
if ($LASTEXITCODE -eq 0) {
    Write-Host "Testing production build..." -ForegroundColor Yellow
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Build completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "Build failed. Please check the error messages above." -ForegroundColor Red
    }
} else {
    Write-Host "Dependency installation failed. Please check the error messages above." -ForegroundColor Red
}

Write-Host "Script completed. Press any key to continue..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
