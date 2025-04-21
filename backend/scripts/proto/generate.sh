#!/bin/bash

# Exit on error
set -e

# Ensure we are in the backend root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Validate correct ROOT_DIR
if [ ! -d "$ROOT_DIR/pkg/proto/core" ]; then
    echo "ERROR: Incorrect ROOT_DIR detected: $ROOT_DIR"
    echo "Expected pkg/proto/core to exist but not found."
    exit 1
fi

echo "Using ROOT_DIR: $ROOT_DIR"

# Function to clean old generated files
clean_generated() {
    echo "Cleaning old generated files..."
    rm -rf "$ROOT_DIR/pkg/proto/generated"/*
    for module in auth user school major activity checkin; do
        if [ -d "$ROOT_DIR/module/$module/proto/generated" ]; then
            rm -rf "$ROOT_DIR/module/$module/proto/generated"/*
        fi
    done
}

# Function to create necessary directories
create_dirs() {
    echo "Creating directories..."

    mkdir -p "$ROOT_DIR/pkg/proto/generated"
    chmod 755 "$ROOT_DIR/pkg/proto/generated"

    for module in auth user school major activity checkin; do
        if [ -d "$ROOT_DIR/module/$module/proto" ]; then
            mkdir -p "$ROOT_DIR/module/$module/proto/generated"
            chmod 755 "$ROOT_DIR/module/$module/proto/generated"
        fi
    done

    echo "Directories created successfully"
}

# Function to generate core proto files
generate_core_proto() {
    echo "Generating core proto files..."
    cd "$ROOT_DIR"
    protoc \
        --proto_path="." \
        --go_out="pkg/proto/generated" \
        --go-grpc_out="pkg/proto/generated" \
        "pkg/proto/core/"*.proto
}

# Function to generate module proto files
generate_module_proto() {
    local module=$1
    echo "Generating ${module} proto files..."

    if [ -d "$ROOT_DIR/module/$module/proto" ]; then
        cd "$ROOT_DIR"
        protoc \
            --proto_path="." \
            --go_out="module/$module/proto/generated" \
            --go-grpc_out="module/$module/proto/generated" \
            "module/$module/proto"/*.proto
    fi
}

# Main execution
echo "Starting proto generation..."

# Clean old files
clean_generated

# Create directories
create_dirs

# Generate core proto files first
generate_core_proto

# Generate module proto files in dependency order
generate_module_proto "school"
generate_module_proto "auth"
generate_module_proto "user"
generate_module_proto "major"
generate_module_proto "activity"
generate_module_proto "checkin"

echo "Proto generation completed!"
