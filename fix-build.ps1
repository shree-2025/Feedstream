# Stop any running Node processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Clean up
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Force pnpm-lock.yaml -ErrorAction SilentlyContinue
Remove-Item -Force yarn.lock -ErrorAction SilentlyContinue

# Clear npm cache
npm cache clean --force

# Install specific Node version (if nvm is available)
if (Get-Command nvm -ErrorAction SilentlyContinue) {
    nvm install 18.17.0
    nvm use 18.17.0
}

# Install dependencies with specific flags
$env:NODE_OPTIONS = "--openssl-legacy-provider"
$env:NPM_CONFIG_LEGACY_PEER_DEPS = "true"

# Install dependencies
npm install --no-optional --legacy-peer-deps

# Run build
npm run build
