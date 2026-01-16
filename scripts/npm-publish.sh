#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting NPM release process...${NC}"

# Switch to working directory if specified
if [ -n "$WORKING_DIR" ]; then
    echo -e "📂 Switching to directory: ${YELLOW}${WORKING_DIR}${NC}"
    cd "$WORKING_DIR"
fi

# Check for package.json
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found in the current directory.${NC}"
    exit 1
fi

# Extract version and name from package.json
PACKAGE_NAME=$(node -p "require('./package.json').name")
PACKAGE_VERSION=$(node -p "require('./package.json').version")

if [ -z "$PACKAGE_NAME" ] || [ -z "$PACKAGE_VERSION" ]; then
    echo -e "${RED}❌ Error: Could not extract name or version from package.json.${NC}"
    exit 1
fi

echo -e "📦 Package: ${YELLOW}${PACKAGE_NAME}${NC}"
echo -e "🏷️ Version: ${YELLOW}${PACKAGE_VERSION}${NC}"

# Optional version check
if [ "$CHECK_VERSION_BUMP" != "false" ]; then
    echo -e "🔍 Checking if version ${PACKAGE_VERSION} is already published..."
    # npm view returns exit code 1 if package or version doesn't exist
    if npm view "${PACKAGE_NAME}@${PACKAGE_VERSION}" version >/dev/null 2>&1; then
        echo -e "${RED}❌ Error: Version ${PACKAGE_VERSION} is already published to the registry.${NC}"
        echo -e "${YELLOW}Please bump the version in package.json before releasing.${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ Version ${PACKAGE_VERSION} is new. Proceeding...${NC}"
    fi
fi

# Build project if command provided
if [ -n "$BUILD_COMMAND" ]; then
    echo -e "🏗️ Running build: ${YELLOW}${BUILD_COMMAND}${NC}"
    eval "$BUILD_COMMAND"
fi

# Publish to NPM
echo -e "🚢 Publishing to NPM..."
PUBLISH_ARGS=()

if [ -n "$REGISTRY_URL" ]; then
    PUBLISH_ARGS+=("--registry" "$REGISTRY_URL")
fi

if [ "$PROVENANCE" == "true" ]; then
    PUBLISH_ARGS+=("--provenance")
fi

if [ -n "$PUBLISH_TAG" ]; then
    PUBLISH_ARGS+=("--tag" "$PUBLISH_TAG")
fi

# If NPM_TOKEN is provided, ensure it's used (though npm usually picks it up from env or .npmrc)
# The orchestration layer (GH Action) should handle .npmrc setup for NODE_AUTH_TOKEN
npm publish "${PUBLISH_ARGS[@]}"

echo -e "${GREEN}✅ Successfully published ${PACKAGE_NAME}@${PACKAGE_VERSION}${NC}"
