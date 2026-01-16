#!/bin/bash
set -e

# Reusable Workflows CLI UX Test Script
# Verifies CLI behavior across different repository states

REPO_ROOT=$(pwd)
CLI_DIR="$REPO_ROOT/cli"
TEST_TEMP_DIR="$REPO_ROOT/cli/test/ux-temp"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Cleanup on exit
trap 'rm -rf "$TEST_TEMP_DIR"' EXIT

echo -e "${BLUE}🚀 Starting CLI UX Tests...${NC}"

# Cleanup previous tests
rm -rf "$TEST_TEMP_DIR"
mkdir -p "$TEST_TEMP_DIR"

# Test Case 1: Fresh Repository (No existing workflows)
echo -e "\n${BLUE}[Test 1] Fresh Repository - Non-interactive mode${NC}"
TEST1_DIR="$TEST_TEMP_DIR/fresh-repo"
mkdir -p "$TEST1_DIR"
cd "$TEST1_DIR"

# Run CLI for npm-release-ops
node "$CLI_DIR/index.js" npm-release-ops --non-interactive

if [ -f ".github/workflows/npm-release-ops.yml" ]; then
    echo -e "${GREEN}✅ Successfully generated manifest in fresh repo${NC}"
else
    echo -e "❌ Failed to generate manifest in fresh repo"
    exit 1
fi

# Test Case 2: Existing Configuration Detection
echo -e "\n${BLUE}[Test 2] Existing Configuration Detection${NC}"
TEST2_DIR="$TEST_TEMP_DIR/existing-config"
mkdir -p "$TEST2_DIR/.github/workflows"
cd "$TEST2_DIR"

# Create a mock workflow with existing values
cat > .github/workflows/npm-release-ops.yml <<EOF
name: Release
on: push
jobs:
  release:
    uses: udx/reusable-workflows/.github/workflows/npm-release-ops.yml@master
    with:
      node_version: "22"
      check_version_bump: false
EOF

# Run CLI - it should detect node_version "22" and check_version_bump false
node "$CLI_DIR/index.js" npm-release-ops --non-interactive

# Verify detected values were preserved (by checking generated file)
if grep -q 'node_version: "22"' .github/workflows/npm-release-ops.yml && grep -q "check_version_bump: false" .github/workflows/npm-release-ops.yml; then
    echo -e "${GREEN}✅ Successfully detected and preserved existing configuration${NC}"
else
    echo -e "❌ Failed to detect existing configuration"
    exit 1
fi

# Test Case 3: Positional Argument Selection
echo -e "\n${BLUE}[Test 3] Positional Argument Selection${NC}"
TEST3_DIR="$TEST_TEMP_DIR/positional-arg"
mkdir -p "$TEST3_DIR"
cd "$TEST3_DIR"

# Run CLI with positional arg but interactive (should skip selection prompt)
# Note: We can't easily automate interactive prompts here without expects, 
# but we can verify it doesn't crash and starts the right template if we piped input.
# For now, let's just use non-interactive to verify positional arg works.
node "$CLI_DIR/index.js" docker-ops --non-interactive

if [ -f ".github/workflows/docker-ops.yml" ]; then
    echo -e "${GREEN}✅ Successfully used positional argument for template selection${NC}"
else
    echo -e "❌ Failed to use positional argument"
    exit 1
fi

# Test Case 4: Version Pinning
echo -e "\n${BLUE}[Test 4] Version Pinning${NC}"
TEST4_DIR="$TEST_TEMP_DIR/version-pinning"
mkdir -p "$TEST4_DIR"
cd "$TEST4_DIR"

# Run CLI with --ref pinning
node "$CLI_DIR/index.js" npm-release-ops --non-interactive --ref "v1.2.3"

if grep -q "@v1.2.3" ".github/workflows/npm-release-ops.yml"; then
    echo -e "${GREEN}✅ Successfully pinned workflow to v1.2.3${NC}"
else
    echo -e "❌ Failed to pin workflow version"
    exit 1
fi

echo -e "\n${GREEN}✨ All CLI UX Tests Passed!${NC}"

# Cleanup
cd "$REPO_ROOT"
rm -rf "$TEST_TEMP_DIR"
