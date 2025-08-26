# Reset project dependencies with enhanced error handling
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

# Function to run npm install with error handling
function Invoke-NpmInstall {
    param (
        [string]$InstallArgs = ""
    )
    
    Write-Host "Running: npm install $InstallArgs" -ForegroundColor Cyan
    $installProcess = Start-Process -FilePath "npm" -ArgumentList "install $InstallArgs" -NoNewWindow -PassThru -Wait
    
    if ($installProcess.ExitCode -ne 0) {
        Write-Host "Installation failed with exit code $($installProcess.ExitCode)" -ForegroundColor Red
        return $false
    }
    return $true
}

# Attempt installation with different strategies
$installSuccess = $false
$attempts = @(
    "--legacy-peer-deps --no-optional",
    "--legacy-peer-deps --force",
    "--force --no-optional"
)

foreach ($attempt in $attempts) {
    if (-not $installSuccess) {
        Write-Host "`nAttempting installation with: $attempt" -ForegroundColor Yellow
        $installSuccess = Invoke-NpmInstall -InstallArgs $attempt
    }
}

# Final check
if (-not $installSuccess) {
    Write-Host "`nAll installation attempts failed. Please check the error messages above." -ForegroundColor Red
    exit 1
}

# Verify installation
Write-Host "`nVerifying installation..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
    
    # Run a production build test
    Write-Host "`nTesting production build..." -ForegroundColor Yellow
    $buildProcess = Start-Process -FilePath "npm" -ArgumentList "run build" -NoNewWindow -PassThru -Wait
    
    if ($buildProcess.ExitCode -eq 0) {
        Write-Host "Build completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "Build failed with exit code $($buildProcess.ExitCode)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "node_modules directory not found. Installation may have failed." -ForegroundColor Red
    exit 1
}

Write-Host "`nDependency reset completed!" -ForegroundColor Green

Write-Host "Dependency installation completed. Exit code: $LASTEXITCODE" -ForegroundColor Green
