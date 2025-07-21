#!/bin/bash

# Do not exit on error
set +e

hllc i

echo "🔧 Building admin (Next.js)..."
cd ./frontend/admin
bun run build
if [ $? -ne 0 ]; then
  echo "❌ Failed to build admin"
fi

echo "🔧 Building student-web (Next.js)..."
cd ../student-web
bun run build
if [ $? -ne 0 ]; then
  echo "❌ Failed to build student web"
fi

echo "🔧 Building main-backend (NestJS)..."
cd ../../backend/app
bun run build
if [ $? -ne 0 ]; then
  echo "❌ Failed to build main-backend"
fi

echo "🔧 Building chat-backend (Go)..."
cd ../chat
go build -o chat-backend main.go
if [ $? -ne 0 ]; then
  echo "❌ Failed to build chat-backend"
fi

echo "✅ Build script finished."
