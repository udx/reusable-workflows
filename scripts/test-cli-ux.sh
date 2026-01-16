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
mkdir -p "$TEST2_DIR"
cp -r "$CLI_DIR/test/cases/repo-single/.github" "$TEST2_DIR/"
cd "$TEST2_DIR"

# Run CLI for docker-ops - should auto-detect from the seeded file
node "$CLI_DIR/index.js" docker-ops --non-interactive

# Verify common detected value
if grep -q "image_name: test" ".github/workflows/docker-ops.yml"; then
    echo -e "${GREEN}✅ Successfully detected existing configuration${NC}"
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

# Test Case 5: Multi-Template Detection
echo -e "\n${BLUE}[Test 5] Multi-Template Detection${NC}"
TEST5_DIR="$TEST_TEMP_DIR/multi-template"
mkdir -p "$TEST5_DIR"
cp -r "$CLI_DIR/test/cases/repo-multi/.github" "$TEST5_DIR/"
cd "$TEST5_DIR"

# Run CLI for npm-release-ops and verify it ONLY picked up npm values
node "$CLI_DIR/index.js" npm-release-ops --non-interactive

if grep -q "working_directory: multi-npm-dir" ".github/workflows/npm-release-ops.yml" && ! grep -q "multi-docker-image" ".github/workflows/npm-release-ops.yml"; then
    echo -e "${GREEN}✅ Successfully isolated configuration in multi-template repo${NC}"
else
    echo -e "❌ Multi-template detection failed or leaked values"
    exit 1
fi

# Test Case 6: Configuration Presets
echo -e "\n${BLUE}[Test 6] Configuration Presets${NC}"
TEST6_DIR="$TEST_TEMP_DIR/presets"
mkdir -p "$TEST6_DIR"
cd "$TEST6_DIR"

# Run CLI with --preset
node "$CLI_DIR/index.js" docker-ops --non-interactive --preset "Minimal"

if grep -q "uses: udx/reusable-workflows/.github/workflows/docker-ops.yml@master" ".github/workflows/docker-ops.yml" && grep -q "image_name: \"\?my-app\"\?" ".github/workflows/docker-ops.yml"; then
    echo -e "${GREEN}✅ Successfully generated manifest from preset${NC}"
else
    echo -e "❌ Preset-based generation failed (Check .github/workflows/docker-ops.yml content)"
    cat .github/workflows/docker-ops.yml
    exit 1
fi

echo -e "\n${GREEN}✨ All CLI UX Tests Passed!${NC}"

# Cleanup
cd "$REPO_ROOT"
rm -rf "$TEST_TEMP_DIR"
