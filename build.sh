#!/bin/bash

# Clean up previous installations
echo "Cleaning up..."
rm -rf node_modules
rm -f package-lock.json

# Set environment variables for Linux build
export NODE_ENV=production
export NPM_CONFIG_PLATFORM=linux

# Install dependencies
echo "Installing dependencies..."
npm install --no-optional --legacy-peer-deps --force

# Build the application
echo "Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Build completed successfully!"
    exit 0
else
    echo "Build failed!"
    exit 1
fi
