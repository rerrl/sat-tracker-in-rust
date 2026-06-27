#!/bin/bash

# Script to install sat-tracker AppImage to local bin directory

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Installing sat-tracker to ~/.local/bin...${NC}"

# Find the AppImage in build-output directory (in project root)
BUILD_OUTPUT_DIR="$HOME/Projects/sat-tracker-in-rust/build-output"
APPIMAGE_PATTERN="sat-tracker-in-rust_*_amd64.AppImage"

if [ ! -d "$BUILD_OUTPUT_DIR" ]; then
    echo -e "${RED}Error: build-output directory not found at $BUILD_OUTPUT_DIR!${NC}"
    echo "Make sure you've built the application first."
    exit 1
fi

# Find the AppImage file
APPIMAGE_FILE=$(find "$BUILD_OUTPUT_DIR" -name "$APPIMAGE_PATTERN" -type f | head -n 1)

if [ -z "$APPIMAGE_FILE" ]; then
    echo -e "${RED}Error: No AppImage found matching pattern $APPIMAGE_PATTERN in $BUILD_OUTPUT_DIR${NC}"
    exit 1
fi

echo -e "Found AppImage: ${GREEN}$APPIMAGE_FILE${NC}"

# Target filename
LOCAL_BIN_DIR="$HOME/.local/bin"
TARGET_FILE="$LOCAL_BIN_DIR/sat-tracker-in-rust.AppImage"

# Copy the AppImage
echo -e "Copying to ${GREEN}$TARGET_FILE${NC}"
if [ -f "$TARGET_FILE" ]; then
    echo -e "${YELLOW}Warning: Target file already exists. If you get a 'Text file busy' error,${NC}"
    echo -e "${YELLOW}make sure to close the running sat-tracker application first.${NC}"
fi
cp "$APPIMAGE_FILE" "$TARGET_FILE"

# Change ownership to current user (in case it was built with different permissions)
chown "$USER:$(id -gn)" "$TARGET_FILE"

# Make it executable
chmod +x "$TARGET_FILE"

echo -e "${GREEN}✓ Installation complete!${NC}"
echo -e "AppImage installed to: ${GREEN}$TARGET_FILE${NC}"

# Check if ~/.local/bin is in PATH
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    echo -e "${YELLOW}Warning: ~/.local/bin is not in your PATH${NC}"
    echo "Add this line to your ~/.bashrc or ~/.zshrc:"
    echo "export PATH=\"\$HOME/.local/bin:\$PATH\""
fi
