#!/bin/bash

# Exit on error
set -e

# Ensure we are in the backend root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Fixing generated proto files directory structure..."

# Fix core proto files
if [ -d "$ROOT_DIR/pkg/proto/generated/github.com" ]; then
    echo "Fixing core proto files..."
    find "$ROOT_DIR/pkg/proto/generated/github.com" -name "*.pb.go" -exec cp {} "$ROOT_DIR/pkg/proto/generated/" \;
    find "$ROOT_DIR/pkg/proto/generated/github.com" -name "*_grpc.pb.go" -exec cp {} "$ROOT_DIR/pkg/proto/generated/" \;
    rm -rf "$ROOT_DIR/pkg/proto/generated/github.com"
fi

# Fix module proto files
for module in auth user school major activity checkin; do
    if [ -d "$ROOT_DIR/module/$module/proto/generated/github.com" ]; then
        echo "Fixing $module proto files..."
        find "$ROOT_DIR/module/$module/proto/generated/github.com" -name "*.pb.go" -exec cp {} "$ROOT_DIR/module/$module/proto/generated/" \;
        find "$ROOT_DIR/module/$module/proto/generated/github.com" -name "*_grpc.pb.go" -exec cp {} "$ROOT_DIR/module/$module/proto/generated/" \;
        rm -rf "$ROOT_DIR/module/$module/proto/generated/github.com"
    fi
done

echo "Fixed generated proto files directory structure!"