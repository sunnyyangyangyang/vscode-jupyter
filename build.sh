#!/bin/bash
# Jupyter VS Code Extension Build Script (No Telemetry)
# 
# Usage: ./build.sh
# Output: jupyter-no-telemetry.vsix

set -e

echo "========================================"
echo "Jupyter Extension Build (No Telemetry)"
echo "========================================"

# Install dependencies
echo "[1/3] Installing dependencies..."
npm install -y

# Compile TypeScript
echo "[2/3] Compiling TypeScript..."
npm run compile-tsc

# Package the extension
echo "[3/3] Packaging extension..."
npx vsce package -o jupyter-no-telemetry.vsix

echo ""
echo "========================================"
echo "Build Complete!"
echo "========================================"
echo ""
echo "Output: jupyter-no-telemetry.vsix"
echo "Install: code --install-extension jupyter-no-telemetry.vsix"