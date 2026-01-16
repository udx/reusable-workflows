#!/bin/bash
set -e

# Reusable Workflows CLI Asset-Driven UX Test Runner
# Verifies CLI behavior by comparing output against source templates and examples

REPO_ROOT=$(pwd)
CLI_DIR="$REPO_ROOT/cli"

echo -e "\033[0;34m🚀 Running Asset-Driven UX Tests...\033[0m"

# Ensure dependencies are available (though they should be if CLI works)
cd "$CLI_DIR"
node test/run-ux.js

echo -e "\n\033[0;32m✨ UX Test Suite Execution Complete\033[0m"
