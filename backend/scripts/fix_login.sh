#!/bin/bash

# fix_login.sh - Script to fix login issues by cleaning auth_tokens collection
# Author: Nimit Tanboontor

echo "-------------------------------------------"
echo "HLLC-2025 Login Issue Fix Script"
echo "-------------------------------------------"
echo "This script will clean up the auth_tokens collection and restart the API server"
echo

# Step 1: Clean up auth tokens
echo "Step 1: Cleaning up auth tokens..."
go run scripts/cleanup_auth_tokens.go

if [ $? -ne 0 ]; then
  echo "Failed to clean up auth tokens. Exiting."
  exit 1
fi

echo
echo "Step 2: Running migration to reset admin credentials..."
go run main.go migrate

if [ $? -ne 0 ]; then
  echo "Migration failed. Exiting."
  exit 1
fi

echo
echo "Step 3: Starting API server..."
echo "The server will start in the background. Use 'pkill -f \"go run main.go api\"' to stop it."
echo
go run main.go api &

echo
echo "-------------------------------------------"
echo "Login fix completed successfully!"
echo "-------------------------------------------"
echo
echo "Admin credentials:"
echo "Username: admin"
echo "Password: password123"
echo
echo "Regular user credentials:"
echo "Username: user"
echo "Password: user123"
echo
echo "API server is running on http://localhost:3000"
echo "Press Ctrl+C to exit this script (the server will continue running)"
echo "-------------------------------------------"

# Keep the script running until Ctrl+C
wait 