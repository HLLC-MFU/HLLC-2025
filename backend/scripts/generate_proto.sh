#!/bin/bash

# Generate auth proto
protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    module/auth/proto/authPb.proto

# Generate user proto
protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    module/user/proto/userPb.proto 