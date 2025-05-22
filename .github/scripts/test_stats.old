#!/bin/bash

# test_stats.sh - Test the contributor stats script locally
# Usage: ./test_stats.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "${REPO_ROOT}" || exit 1

echo "Testing contributor stats script..."
python3 .github/scripts/update_contributor_stats.py

echo "Done! Check the README.md file for updates." 