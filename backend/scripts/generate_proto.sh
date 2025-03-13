#!/bin/bash

# Set the root directory
ROOT_DIR=$(pwd)

# Create proto output directories if they don't exist
mkdir -p module/auth/proto
mkdir -p module/user/proto
mkdir -p module/school/proto
mkdir -p module/major/proto

# First, generate school proto (since it's a dependency)
protoc --proto_path=. \
    --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    module/school/proto/schoolPb.proto

# Generate auth proto
protoc --proto_path=. \
    --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    module/auth/proto/authPb.proto

# Generate user proto
protoc --proto_path=. \
    --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    module/user/proto/userPb.proto

# Finally, generate major proto (since it depends on school)
protoc --proto_path=. \
    --proto_path=module \
    --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    module/major/proto/majorPb.proto 