# Stop any running npm processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Remove node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Force pnpm-lock.yaml -ErrorAction SilentlyContinue
Remove-Item -Force yarn.lock -ErrorAction SilentlyContinue

# Clear npm cache
npm cache clean --force

# Install dependencies with legacy peer deps
npm install --legacy-peer-deps

# If npm install fails, try with --force
if ($LASTEXITCODE -ne 0) {
    npm install --legacy-peer-deps --force
}

Write-Host "Dependency installation completed. Exit code: $LASTEXITCODE" -ForegroundColor Green
