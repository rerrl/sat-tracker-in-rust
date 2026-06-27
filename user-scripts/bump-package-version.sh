#!/bin/bash
#
# bump-package-version.sh — Bump version across package.json, Cargo.toml, tauri.conf.json
#
# Usage:
#   ./user-scripts/bump-package-version.sh          # interactive — shows current, asks for new
#   ./user-scripts/bump-package-version.sh 0.2.0    # set explicit version
#

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# -- Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${CYAN}▸${NC} $*"; }
ok()   { echo -e "${GREEN}✓${NC} $*"; }

# -- Read current version from package.json
CURRENT=$(grep '"version"' "$REPO_DIR/package.json" | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')

echo -e "${CYAN}Current version: ${CURRENT}${NC}"

# -- Compute default (patch bump)
IFS='.' read -r MAJ MIN PAT <<< "$CURRENT"
DEFAULT="${MAJ}.${MIN}.$((PAT + 1))"

# -- Get new version
if [[ -n "${1:-}" ]]; then
    NEW_VERSION="$1"
else
    echo -ne "${YELLOW}New version [${DEFAULT}]: ${NC}"
    read -r input
    NEW_VERSION="${input:-$DEFAULT}"
fi

if [[ "$NEW_VERSION" == "$CURRENT" ]]; then
    echo -e "${YELLOW}Version unchanged. Exiting.${NC}"
    exit 0
fi

# -- Update files
# package.json — line 4: "version": "X.Y.Z",
sed -i "4s/\"version\": \"${CURRENT}\"/\"version\": \"${NEW_VERSION}\"/" "$REPO_DIR/package.json"

# Cargo.toml — line 3: version = "X.Y.Z"
sed -i "3s/version = \"${CURRENT}\"/version = \"${NEW_VERSION}\"/" "$REPO_DIR/src-tauri/Cargo.toml"

# tauri.conf.json — line 4: "version": "X.Y.Z",
sed -i "4s/\"version\": \"${CURRENT}\"/\"version\": \"${NEW_VERSION}\"/" "$REPO_DIR/src-tauri/tauri.conf.json"

# -- Regenerate lockfiles
info "Generating Cargo.lock..."
cargo generate-lockfile --manifest-path "$REPO_DIR/src-tauri/Cargo.toml" --quiet 2>/dev/null
ok "Cargo.lock updated"

info "Running yarn install to sync yarn.lock..."
yarn install --silent --cwd "$REPO_DIR"
ok "yarn.lock updated"

# -- Git commit all changed files
info "Staging and committing..."
cd "$REPO_DIR"
git add \
    package.json \
    yarn.lock \
    src-tauri/Cargo.toml \
    src-tauri/Cargo.lock \
    src-tauri/tauri.conf.json

git commit -m "chore: bump version to ${NEW_VERSION}"

echo
echo -e "${GREEN}✓ Version bumped: ${CURRENT} → ${NEW_VERSION}${NC}"
echo "  package.json"
echo "  yarn.lock"
echo "  src-tauri/Cargo.toml"
echo "  src-tauri/Cargo.lock"
echo "  src-tauri/tauri.conf.json"
echo
echo "  Committed. Run 'git push' when ready."
