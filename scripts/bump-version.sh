#!/bin/bash

# Script to bump version across all package files
# Usage: ./scripts/bump-version.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Version Bump Script${NC}"
echo "This will update the version in:"
echo "  - package.json"
echo "  - src-tauri/Cargo.toml"
echo "  - src-tauri/tauri.conf.json"
echo

# Get current version from package.json
CURRENT_VERSION=$(grep '"version":' package.json | head -1 | sed 's/.*"version": *"\([^"]*\)".*/\1/')
echo -e "Current version: ${GREEN}${CURRENT_VERSION}${NC}"
echo

# Prompt for new version
read -p "Enter new version (x.y.z): " NEW_VERSION

# Validate version format (basic check)
if [[ ! $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}❌ Invalid version format. Please use x.y.z format (e.g., 1.2.3)${NC}"
    exit 1
fi

echo
echo -e "Updating version to: ${GREEN}${NEW_VERSION}${NC}"
echo

# Update package.json
echo "📦 Updating package.json..."
sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json

# Update src-tauri/Cargo.toml
echo "🦀 Updating src-tauri/Cargo.toml..."
sed -i "s/version = \"$CURRENT_VERSION\"/version = \"$NEW_VERSION\"/" src-tauri/Cargo.toml

# Update src-tauri/tauri.conf.json
echo "⚙️  Updating src-tauri/tauri.conf.json..."
sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" src-tauri/tauri.conf.json

echo
echo -e "${GREEN}✅ Version successfully updated to ${NEW_VERSION}!${NC}"
echo
echo "Updated files:"
echo "  ✓ package.json"
echo "  ✓ src-tauri/Cargo.toml"
echo "  ✓ src-tauri/tauri.conf.json"
echo
echo -e "${YELLOW}💡 Don't forget to commit these changes!${NC}"
