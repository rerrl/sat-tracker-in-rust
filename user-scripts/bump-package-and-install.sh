#!/bin/bash
#
# bump-package-and-install.sh — Bump version → push → build
#
# Runs the existing scripts/bump-version.sh (interactive), regenerates
# lockfiles, commits, pushes, then builds the Tauri release.
#
# Usage:
#   ./user-scripts/bump-package-and-install.sh           # interactive version prompt
#   ./user-scripts/bump-package-and-install.sh 0.2.0     # NOT supported — uses built-in prompt
#

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# -- Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${CYAN}▸${NC} $*"; }
ok()    { echo -e "${GREEN}✓${NC} $*"; }
warn()  { echo -e "${YELLOW}⚠${NC} $*"; }
die()   { echo -e "${RED}✗${NC} $*" >&2; exit 1; }

APP_NAME="sat-tracker-in-rust"

echo -e "${CYAN}━━━ Bump → Push → Build ━━━${NC}"
echo

# ── Step 1: Bump version (interactive — uses existing script) ─────
info "Step 1/4 — Bumping version..."
cd "$REPO_DIR"
"$REPO_DIR/scripts/bump-version.sh"
echo

# ── Step 2: Regenerate lockfiles & commit ──────────────────────────
info "Step 2/4 — Regenerating lockfiles..."

info "  Generating Cargo.lock..."
cargo generate-lockfile --manifest-path "$REPO_DIR/src-tauri/Cargo.toml" --quiet 2>/dev/null
ok "  Cargo.lock updated"

info "  Running yarn install to sync yarn.lock..."
yarn install --silent
ok "  yarn.lock updated"

# Read the new version from package.json
NEW_VERSION=$(grep '"version"' "$REPO_DIR/package.json" | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')

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
echo -e "${GREEN}✓ Version bumped: ${NEW_VERSION}${NC}"
echo "  package.json"
echo "  yarn.lock"
echo "  src-tauri/Cargo.toml"
echo "  src-tauri/Cargo.lock"
echo "  src-tauri/tauri.conf.json"
echo

# ── Step 3: Push ──────────────────────────────────────────────────
info "Step 3/4 — Pushing to origin..."
CURRENT_BRANCH="$(git branch --show-current)"
git push origin "$CURRENT_BRANCH"
echo

# ── Step 4: Build ─────────────────────────────────────────────────
info "Step 4/4 — Building Tauri release..."
yarn build:release
echo

echo -e "${GREEN}━━━ All done — version bumped, pushed, and built. ━━━${NC}"
echo
echo "  Binary: src-tauri/target/release/${APP_NAME}"