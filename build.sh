#!/bin/bash
set -e

BUILD_DIR="/home/sunny/Documents/jupyter-build-home/vscodium-jupyter"
SRC_DIR="/home/sunny/Documents/vscodium-jupyter"
CONTAINER="jupyter-build"
TSC="$BUILD_DIR/node_modules/.bin/tsc"

echo "=== Step 0: Start container ==="
STATUS=$(podman inspect --format '{{.State.Status}}' "$CONTAINER" 2>/dev/null || echo "not found")
if [ "$STATUS" = "exited" ] || [ "$STATUS" = "stopped" ]; then
    podman start "$CONTAINER"
fi

# Sync all source files to container (keep node_modules intact)
rsync -a --delete \
    --exclude='node_modules/' \
    --exclude='out/' \
    --exclude='dist/' \
    --exclude='*.vsix' \
    "$SRC_DIR/" "$BUILD_DIR/"

# Check if dependencies are valid, reinstall if needed
if ! podman exec "$CONTAINER" test -f "$BUILD_DIR/node_modules/@types/vscode/index.d.ts"; then
    echo "Dependencies missing or corrupted, running npm install..."
    podman exec "$CONTAINER" sh -c "cd $BUILD_DIR && npm install --include=dev 2>&1 | tail -3"
fi

echo "=== Step 2: Add build suffix ==="
BUILD_SUFFIX=$(date +'%y%m%d')
CURRENT_VER=$(podman exec "$CONTAINER" node -p "require('$BUILD_DIR/package.json').version")

if [[ ! "$CURRENT_VER" =~ -b${BUILD_SUFFIX}$ ]]; then
    NEW_VER="${CURRENT_VER}-b${BUILD_SUFFIX}"
    echo "Version tag: $CURRENT_VER -> $NEW_VER"
    podman exec "$CONTAINER" node -e "
const p = require('$BUILD_DIR/package.json');
p.version = '$NEW_VER';
require('fs').writeFileSync('$BUILD_DIR/package.json', JSON.stringify(p, null, 4) + '\n');
"
else
    echo "Version is current: $CURRENT_VER"
fi

# Read final version from container for vsix filename
TODAY_VER=$(podman exec "$CONTAINER" node -p "require('$BUILD_DIR/package.json').version")

echo "=== Step 3: TypeScript compile ==="
podman exec "$CONTAINER" "$TSC" -p "$BUILD_DIR"

echo "=== Step 4: esbuild (npm run build) ==="
podman exec "$CONTAINER" sh -c "cd $BUILD_DIR && npm run build 2>&1 | tail -5"

echo "=== Step 5: Package vsix ==="
VSIX_NAME="jupyter-${TODAY_VER}.vsix"
podman exec "$CONTAINER" sh -c "cd $BUILD_DIR && npx vsce package 2>&1 | grep DONE || true"

echo "=== Step 6: Copy vsix to host ==="
podman cp "$CONTAINER":$BUILD_DIR/$VSIX_NAME "$SRC_DIR/$VSIX_NAME"

ls -lh "$SRC_DIR/$VSIX_NAME"
echo ""
echo "=== Build complete! ==="
echo "Output: $SRC_DIR/$VSIX_NAME"
echo "Install: codium --install-extension \$SRC_DIR/\$VSIX_NAME"
