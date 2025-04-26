#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Move to project root
cd "$(dirname "$0")/.."

echo "🚀 Starting Kafka and Zookeeper containers..."

docker compose up -d zookeeper kafka kafdrop

echo "✅ Kafka and UI are up and running!"
echo "🌐 Access Kafka UI at: http://localhost:9000"
